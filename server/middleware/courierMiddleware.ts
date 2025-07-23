import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "./authMiddleware";



export const courierMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.cookies?.token ;
    if (!token) {
        res.status(401).json({ message: 'Unauthorized (no token)' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string, role: string };
        if (decoded.role !== "courier") {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        (req as AuthRequest).userId = decoded.userId;
        next();

    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
        return;
    }
}