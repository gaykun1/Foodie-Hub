
import express from "express"
import { createPaymentIntent } from "../controllers/payController";
import { authMiddleware } from "../middleware/authMiddleware";

const payRoute = express.Router();

payRoute.post("/payment-intent", authMiddleware, createPaymentIntent);

export default payRoute;