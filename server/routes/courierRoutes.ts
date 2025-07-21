import express from "express"
import { courierMiddleware } from "../middleware/courierMiddleware";
import { changeOrderStatus, checkIfHasOrder, checkIfSentApplication, createApplication, getApplications, profile, takeOrder, toggleApplication } from "../controllers/courierController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const courierRoute = express.Router();

courierRoute.post("/applications", authMiddleware, createApplication);//
courierRoute.get("/applications/status", authMiddleware, checkIfSentApplication);
courierRoute.get("/applications",adminMiddleware, getApplications);//
courierRoute.get("/profile", courierMiddleware, profile);//
courierRoute.post("/orders/:id/take", courierMiddleware, takeOrder);
courierRoute.get("/orders/:id/status", checkIfHasOrder);//
courierRoute.patch("/orders/:id/status", courierMiddleware, changeOrderStatus);//
courierRoute.post("/applications/:id", toggleApplication);//
export default courierRoute;