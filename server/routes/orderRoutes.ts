import express from "express"
import { authMiddleware } from "../middleware/authMiddleware";
import { createOrder, getFreeOrders, getLastSevenOrders, getNumbers, getOrder, getOrders, getOrdersCourier, getOrdersCreated, toggleToPreparing, updateOrder } from "../controllers/orderController";
import { courierMiddleware } from "../middleware/courierMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { restaurantMiddleware } from "../middleware/restaurantMiddleware";

const orderRoute = express.Router();

orderRoute.post("/create-order", authMiddleware, createOrder);
orderRoute.get("/get-created-orders/:id", restaurantMiddleware, getOrdersCreated);
orderRoute.patch("/update-order", authMiddleware, updateOrder);
orderRoute.get("/get-order/:id", authMiddleware, getOrder);
orderRoute.get("/get-orders", authMiddleware, getOrders);
orderRoute.get("/get-last-seven", adminMiddleware, getLastSevenOrders);
orderRoute.get("/get-last-seven/:id", restaurantMiddleware, getLastSevenOrders);
orderRoute.get("/get-orders-courier/:id", getOrdersCourier);
orderRoute.get("/order-values", adminMiddleware, getNumbers);
orderRoute.get("/order-values/:id", restaurantMiddleware, getNumbers);
orderRoute.get("/free-orders/:city", courierMiddleware, getFreeOrders);
orderRoute.patch("/toggle-to-preparing", restaurantMiddleware, toggleToPreparing);

export default orderRoute;