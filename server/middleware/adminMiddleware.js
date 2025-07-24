"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const adminMiddleware = (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    // checking auth token in cookies and headers
    if (!token) {
        res.status(401).json({ message: 'Unauthorized (no token)' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "admin") {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        req.userId = decoded.userId;
        next();
        //returning userId if its admin role
    }
    catch (err) {
        res.status(401).json({ message: 'Invalid token' });
        return;
    }
};
exports.adminMiddleware = adminMiddleware;
