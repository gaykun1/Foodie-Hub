import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

export type Role = "user" | "admin" | "courier" | "restaurant";

export interface AuthRequest extends Request {
    userId: string;
    role: Role;
}

const readToken = (req: Request): string | undefined =>
    req.cookies?.token || req.headers.authorization?.split(" ")[1];

/** Verifies the signature and returns the caller's id, or null. */
const verify = (token: string): { userId: string } | null => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        return decoded?.userId ? { userId: decoded.userId } : null;
    } catch {
        return null;
    }
};

/**
 * Authenticates the caller.
 *
 * The role is deliberately read from the User document rather than from the
 * token's `role` claim. Tokens live for an hour, so a claim can disagree with
 * reality in both directions: a demoted admin would keep admin powers until
 * their token expired, and — more visibly — a user promoted to a restaurant
 * account by `createItem` was locked out of their own dashboard until they
 * signed in again, because their existing token still said "user".
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = readToken(req);
    if (!token) {
        res.status(401).json({ message: "Unauthorized (no token)" });
        return;
    }

    const decoded = verify(token);
    if (!decoded) {
        res.status(401).json({ message: "Invalid token" });
        return;
    }

    try {
        const user = await User.findById(decoded.userId).select("role");
        if (!user) {
            // The account was deleted while a valid token was still in circulation.
            res.status(401).json({ message: "Invalid token" });
            return;
        }

        (req as AuthRequest).userId = decoded.userId;
        (req as AuthRequest).role = user.role as Role;
        next();
    } catch {
        // A datastore failure here must not surface as an unhandled rejection
        // with an empty body — callers get a normal JSON error.
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Authenticates, then requires the caller's stored role to be one of `roles`.
 *
 * Replaces four copy-pasted middlewares that differed only in which role string
 * they compared against, and that each trusted the token's claim.
 */
export const requireRole = (...roles: Role[]) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const token = readToken(req);
        if (!token) {
            res.status(401).json({ message: "Unauthorized (no token)" });
            return;
        }

        const decoded = verify(token);
        if (!decoded) {
            res.status(401).json({ message: "Invalid token" });
            return;
        }

        try {
            const user = await User.findById(decoded.userId).select("role");
            if (!user) {
                res.status(401).json({ message: "Invalid token" });
                return;
            }
            if (!roles.includes(user.role as Role)) {
                res.status(403).json({ message: "Access denied" });
                return;
            }

            (req as AuthRequest).userId = decoded.userId;
            (req as AuthRequest).role = user.role as Role;
            next();
        } catch {
            res.status(500).json({ message: "Server error" });
        }
    };
