
import express from "express"
import { createPaymentIntent } from "../controllers/payController";

const payRoute = express.Router();

payRoute.post("/payment-intent", createPaymentIntent);

export default payRoute;