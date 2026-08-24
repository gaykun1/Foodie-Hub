import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Order from "../models/Order";
import {
    isSimulating,
    isSimulationEnabled,
    startSimulation,
    stopSimulation,
} from "../services/deliverySimulator";

/**
 * Demo-only endpoints. Every handler refuses unless DEMO_SIMULATION is enabled,
 * so a production deployment exposes nothing here even though the routes are
 * always mounted.
 */

const requireDemoMode = (res: Response): boolean => {
    if (!isSimulationEnabled()) {
        res.status(404).json("Not found!");
        return false;
    }
    return true;
};

export const getDemoStatus = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ simulationEnabled: isSimulationEnabled() });
};

export const simulateDelivery = async (req: Request, res: Response): Promise<void> => {
    if (!requireDemoMode(res)) return;
    const id = req.params.id;
    try {
        // Scoped to the caller's own order — the simulator writes real status
        // changes, so it must not be usable against someone else's order.
        const order = await Order.findOne({ _id: id, userId: (req as AuthRequest).userId });
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        if (isSimulating(id)) {
            res.status(200).json({ started: false, reason: "Already in progress" });
            return;
        }

        const result = await startSimulation(id);
        if (!result.ok) {
            res.status(409).json({ started: false, reason: result.reason });
            return;
        }
        res.status(202).json({ started: true });
    } catch {
        res.status(500).json("Server error!");
    }
};

export const cancelSimulation = async (req: Request, res: Response): Promise<void> => {
    if (!requireDemoMode(res)) return;
    const id = req.params.id;
    try {
        const order = await Order.findOne({ _id: id, userId: (req as AuthRequest).userId });
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        res.status(200).json({ stopped: stopSimulation(id) });
    } catch {
        res.status(500).json("Server error!");
    }
};
