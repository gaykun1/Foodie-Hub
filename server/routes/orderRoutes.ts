import express from "express"
import { authMiddleware } from "../middleware/authMiddleware";
import { createOrder, getFreeOrders, getLastSevenOrders, getNumbers, getOrder, getOrders, getOrdersCourier, getOrdersCreated, toggleToPreparing, updateOrder } from "../controllers/orderController";
import { courierMiddleware } from "../middleware/courierMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { restaurantMiddleware } from "../middleware/restaurantMiddleware";

const orderRoute = express.Router();

orderRoute.post("/orders", authMiddleware, createOrder);
orderRoute.get("/orders/:id/created", restaurantMiddleware, getOrdersCreated);//
orderRoute.patch("/orders", authMiddleware, updateOrder);//
orderRoute.get("/orders/:id", authMiddleware, getOrder);//
orderRoute.get("/orders", authMiddleware, getOrders);//
orderRoute.get("/orders/recent", adminMiddleware, getLastSevenOrders);//
orderRoute.get("/restaurants/:id/orders/recent", restaurantMiddleware, getLastSevenOrders);//
orderRoute.get("/couriers/:id/orders", courierMiddleware, getOrdersCourier);//
orderRoute.get("/orders/statistics", adminMiddleware, getNumbers);
orderRoute.get("/restaurants/:id/orders/statistics", restaurantMiddleware, getNumbers);
orderRoute.get("/free-orders/:city", courierMiddleware, getFreeOrders);
orderRoute.patch("/orders/:id/status", restaurantMiddleware, toggleToPreparing);

export default orderRoute;