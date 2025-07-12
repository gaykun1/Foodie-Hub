import express from "express"
import { authMiddleware } from "../middleware/authMiddleware";
import { changeOrderStatus, createOrder, getFreeOrders, getOrder, getOrders, getOrdersCourier,  updateOrder } from "../controllers/orderController";
import { courierMiddleware } from "../middleware/courierMiddleware";

const orderRoute = express.Router();

orderRoute.post("/create-order",authMiddleware, createOrder);
orderRoute.patch("/update-order",authMiddleware, updateOrder);
orderRoute.get("/get-order/:id", authMiddleware,getOrder);
orderRoute.get("/get-orders", authMiddleware,getOrders);
orderRoute.get("/get-orders-courier", courierMiddleware,getOrdersCourier);

orderRoute.get("/free-orders/:city", getFreeOrders);
orderRoute.post("/change-order-status", courierMiddleware, changeOrderStatus);

export default orderRoute;