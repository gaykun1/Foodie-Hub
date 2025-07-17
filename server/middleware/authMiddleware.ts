import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    userId: string;
    role: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Unauthorized (no token)' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string, role: string };
        (req as AuthRequest).userId = decoded.userId;
        (req as AuthRequest).role = decoded.role;
        next();

    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
        return;
    }
}