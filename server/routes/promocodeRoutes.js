"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const adminMiddleware_1 = require("../middleware/adminMiddleware");
const promocodeController_1 = require("../controllers/promocodeController");
const promocodeRoute = express_1.default.Router();
promocodeRoute.post("/promocodes", adminMiddleware_1.adminMiddleware, promocodeController_1.createPromocode);
promocodeRoute.post("/promocodes/:code/use", authMiddleware_1.authMiddleware, promocodeController_1.usePromocode);
promocodeRoute.post("/promocodes/:code", authMiddleware_1.authMiddleware, promocodeController_1.getPromocode);
exports.default = promocodeRoute;
