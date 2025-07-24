import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "./authMiddleware";



export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
   const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    // checking auth token in cookies and headers
    if (!token) {
        res.status(401).json({ message: 'Unauthorized (no token)' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string, role: string };
        if (decoded.role !== "admin") {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        (req as AuthRequest).userId = decoded.userId;
        next();
        //returning userId if its admin role
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
        return;
    }
}