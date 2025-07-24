"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cartController_1 = require("../controllers/cartController");
const cartRoute = express_1.default.Router();
cartRoute.get("/", cartController_1.getCart);
cartRoute.post("/items", cartController_1.addToCart);
cartRoute.patch("/items/:id", cartController_1.updateCartAmount);
exports.default = cartRoute;
