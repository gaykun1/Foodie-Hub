"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.courierMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const courierMiddleware = (req, res, next) => {
    const token = req.cookies?.token;
    // checking auth token in cookies 
    if (!token) {
        res.status(401).json({ message: 'Unauthorized (no token)' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "courier") {
            res.status(403).json({ message: "Access denied" });
            return;
        }
        req.userId = decoded.userId;
        next();
        //returning userId if its courier role
    }
    catch (err) {
        res.status(401).json({ message: 'Invalid token' });
        return;
    }
};
exports.courierMiddleware = courierMiddleware;
