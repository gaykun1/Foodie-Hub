import express from "express"
import { courierMiddleware } from "../middleware/courierMiddleware";
import { changeOrderStatus, checkIfHasOrder, checkIfSentApplication, createApplication, getApplications, profile, takeOrder, toggleApplication } from "../controllers/courierController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";

const courierRoute = express.Router();

courierRoute.post("/applications", authMiddleware, createApplication);
courierRoute.get("/applications/status", authMiddleware, checkIfSentApplication);
courierRoute.get("/applications",adminMiddleware, getApplications);
courierRoute.get("/profile", courierMiddleware, profile);
courierRoute.post("/orders/:id/take", courierMiddleware, takeOrder);
// Scoped to the caller's own courier profile — no id needed in the URL.
courierRoute.get("/orders/status", courierMiddleware, checkIfHasOrder);
courierRoute.patch("/orders/:id/status", courierMiddleware, changeOrderStatus);
// Accepting/declining grants the "courier" role — admin-only, matching the
// applications list route (this action previously had no auth at all).
courierRoute.post("/applications/:id", adminMiddleware, toggleApplication);
export default courierRoute;