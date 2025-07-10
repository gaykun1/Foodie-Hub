import express from "express"
import { courierMiddleware } from "../middleware/courierMiddleware";
import { changeOrderStatus, checkIfSentApplication, createApplication, getApplications, getFreeOrders, takeOrder } from "../controllers/courierController";
import { authMiddleware } from "../middleware/authMiddleware";


const courierRoute = express.Router();
courierRoute.post("/create-application", authMiddleware, createApplication);
courierRoute.get("/check-if-sent", authMiddleware, checkIfSentApplication);
courierRoute.get("/get-applications", getApplications);
courierRoute.get("/free-orders/:city", getFreeOrders);
courierRoute.post("/take-order", courierMiddleware, takeOrder);
courierRoute.post("/change-order-status", courierMiddleware, changeOrderStatus);
export default courierRoute;