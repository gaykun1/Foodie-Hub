import express from "express"
import { authMiddleware } from "../middleware/authMiddleware";
import { createOrder, getFreeOrders, getLastSevenOrders, getNumbers, getOrder, getOrders, getOrdersCourier, getOrdersCreated, toggleToPreparing, updateOrder } from "../controllers/orderController";
import { courierMiddleware } from "../middleware/courierMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { restaurantMiddleware } from "../middleware/restaurantMiddleware";
import { dashboardMiddleware } from "../middleware/dashboardMiddleware";

const orderRoute = express.Router();

orderRoute.post("/orders", authMiddleware, createOrder);
orderRoute.patch("/orders", authMiddleware, updateOrder);
orderRoute.get("/orders", authMiddleware, getOrders);
orderRoute.get("/orders/recent", adminMiddleware, getLastSevenOrders);
orderRoute.get("/orders/statistics", dashboardMiddleware, getNumbers);
orderRoute.get("/restaurants/:id/orders/recent", restaurantMiddleware, getLastSevenOrders);
orderRoute.patch("/orders/:id/status", restaurantMiddleware, toggleToPreparing);
orderRoute.get("/orders/:id/created", restaurantMiddleware, getOrdersCreated);
// Scoped to the caller's own courier profile — no id needed in the URL.
orderRoute.get("/couriers/orders", courierMiddleware, getOrdersCourier);
orderRoute.get("/free-orders/:city", courierMiddleware, getFreeOrders);
orderRoute.get("/orders/:id", authMiddleware, getOrder);



export default orderRoute;