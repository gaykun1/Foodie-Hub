import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { cancelSimulation, getDemoStatus, simulateDelivery } from "../controllers/demoController";

const demoRoute = express.Router();

// Public so the client can decide whether to render demo affordances at all.
demoRoute.get("/status", getDemoStatus);
demoRoute.post("/orders/:id/simulate", authMiddleware, simulateDelivery);
demoRoute.delete("/orders/:id/simulate", authMiddleware, cancelSimulation);

export default demoRoute;
