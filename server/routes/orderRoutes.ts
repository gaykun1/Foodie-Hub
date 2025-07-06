import express from "express"
import { authMiddleware } from "../middleware/authMiddleware";
import { createOrder } from "../controllers/orderController";

const orderRoute = express.Router();

orderRoute.post("/create-order",authMiddleware, createOrder)

export default orderRoute;