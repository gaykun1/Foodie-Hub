import express from "express"
import { authMiddleware } from "../middleware/authMiddleware";
import { createOrder, getFreeOrders,  getLastSevenOrders, getNumbers, getOrder, getOrders, getOrdersCourier, updateOrder } from "../controllers/orderController";
import { courierMiddleware } from "../middleware/courierMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { restaurantMiddleware } from "../middleware/restaurantMiddleware";

const orderRoute = express.Router();

orderRoute.post("/create-order", authMiddleware, createOrder);
orderRoute.patch("/update-order", authMiddleware, updateOrder);
orderRoute.get("/get-order/:id", authMiddleware, getOrder);
orderRoute.get("/get-orders", authMiddleware, getOrders);
orderRoute.get("/get-last-seven", adminMiddleware, getLastSevenOrders);
orderRoute.get("/get-last-seven/:id", restaurantMiddleware, getLastSevenOrders);

orderRoute.get("/get-orders-courier/:id", getOrdersCourier);
orderRoute.get("/order-values", adminMiddleware, getNumbers);

orderRoute.get("/free-orders/:city", getFreeOrders);

export default orderRoute;