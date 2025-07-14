import express from "express"
import { courierMiddleware } from "../middleware/courierMiddleware";
import { changeOrderStatus, checkIfHasOrder, checkIfSentApplication, createApplication, getApplications, profile, takeOrder, toggleApplication } from "../controllers/courierController";
import { authMiddleware } from "../middleware/authMiddleware";

const courierRoute = express.Router();

courierRoute.post("/create-application", authMiddleware, createApplication);
courierRoute.get("/check-if-sent", authMiddleware, checkIfSentApplication);
courierRoute.get("/get-applications", getApplications);
courierRoute.get("/get-courier-profile", courierMiddleware, profile);
courierRoute.post("/take-order", courierMiddleware, takeOrder);
courierRoute.get("/check-if-has-order/:id", checkIfHasOrder);
courierRoute.patch("/change-order-status", courierMiddleware, changeOrderStatus);
courierRoute.post("/toggle-application", toggleApplication);
export default courierRoute;