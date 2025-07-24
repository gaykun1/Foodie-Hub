"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payController_1 = require("../controllers/payController");
const payRoute = express_1.default.Router();
payRoute.post("/payment-intent", payController_1.createPaymentIntent);
exports.default = payRoute;
