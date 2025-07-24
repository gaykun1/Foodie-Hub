"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authRoute = express_1.default.Router();
authRoute.post("/signup", authController_1.signup);
authRoute.post("/login", authController_1.login);
authRoute.post("/logout", authController_1.logout);
authRoute.get("/profile", authMiddleware_1.authMiddleware, authController_1.profile);
authRoute.get("/profile/roles", authMiddleware_1.authMiddleware, authController_1.checkRole);
authRoute.patch("/profile", authMiddleware_1.authMiddleware, authController_1.updateProfile);
exports.default = authRoute;
