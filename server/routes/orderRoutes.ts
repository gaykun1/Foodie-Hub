import express from "express"
import { authMiddleware } from "../middleware/authMiddleware";
import { createOrder, getOrder, getOrders, updateOrder } from "../controllers/orderController";

const orderRoute = express.Router();

orderRoute.post("/create-order",authMiddleware, createOrder);
orderRoute.patch("/update-order",authMiddleware, updateOrder);
orderRoute.get("/get-order/:id", authMiddleware,getOrder);
orderRoute.get("/get-orders", authMiddleware,getOrders);

export default orderRoute;