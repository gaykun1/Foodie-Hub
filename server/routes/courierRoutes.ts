import express from "express"
import { courierMiddleware } from "../middleware/courierMiddleware";
import { changeOrderStatus, checkIfHasOrder, checkIfSentApplication, createApplication, getApplications, profile, takeOrder, toggleApplication } from "../controllers/courierController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const courierRoute = express.Router();

courierRoute.post("/apply", authMiddleware, createApplication);//
courierRoute.get("/is-application-sent", authMiddleware, checkIfSentApplication);//
courierRoute.get("/applications",adminMiddleware, getApplications);//
courierRoute.get("/profile", courierMiddleware, profile);//
courierRoute.post("/take-order", courierMiddleware, takeOrder);
courierRoute.get("/has-order/:id", checkIfHasOrder);//
courierRoute.patch("/update-order-status", courierMiddleware, changeOrderStatus);//
courierRoute.post("/toggle-application", toggleApplication);//
export default courierRoute;