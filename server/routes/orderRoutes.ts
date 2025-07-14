import express from "express"
import { authMiddleware } from "../middleware/authMiddleware";
import { createOrder, getFreeOrders, getNumbers, getOrder, getOrders, getOrdersCourier, updateOrder } from "../controllers/orderController";
import { courierMiddleware } from "../middleware/courierMiddleware";

const orderRoute = express.Router();

orderRoute.post("/create-order", authMiddleware, createOrder);
orderRoute.patch("/update-order", authMiddleware, updateOrder);
orderRoute.get("/get-order/:id", authMiddleware, getOrder);
orderRoute.get("/get-orders", authMiddleware, getOrders);
orderRoute.get("/get-orders-courier/:id", getOrdersCourier);
orderRoute.get("/order-values", getNumbers);

orderRoute.get("/free-orders/:city", getFreeOrders);

export default orderRoute;