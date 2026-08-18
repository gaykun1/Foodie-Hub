import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Order from "../models/Order";
import OrderRating from "../models/OrderRating";
import Courier from "../models/Courier";

export const createOrderRating = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    const { restaurantRating, courierRating, comment } = req.body;
    try {
        const order = await Order.findOne({ _id: id, userId: (req as AuthRequest).userId });
        if (!order) {
            res.status(404).json("Not found!");
            return;
        }
        if (order.status !== "Delivered") {
            res.status(409).json("This order can't be rated yet");
            return;
        }
        if (typeof restaurantRating !== "number" || restaurantRating < 1 || restaurantRating > 5) {
            res.status(400).json("Restaurant rating must be between 1 and 5");
            return;
        }
        if (courierRating != null) {
            if (!order.courierId) {
                res.status(400).json("This order has no courier to rate");
                return;
            }
            if (typeof courierRating !== "number" || courierRating < 1 || courierRating > 5) {
                res.status(400).json("Courier rating must be between 1 and 5");
                return;
            }
        }

        // Defense in depth on top of the unique index — a clean 409 instead of
        // surfacing a raw duplicate-key error to the client.
        const existing = await OrderRating.findOne({ orderId: id });
        if (existing) {
            res.status(409).json("This order has already been rated");
            return;
        }

        let newRating;
        try {
            newRating = await OrderRating.create({
                orderId: id,
                sender: (req as AuthRequest).userId,
                restaurantRating,
                courierRating: courierRating ?? null,
                comment: comment || null,
                courierId: order.courierId ?? null,
            });
        } catch (err: any) {
            if (err?.code === 11000) {
                res.status(409).json("This order has already been rated");
                return;
            }
            throw err;
        }

        // Recompute the courier's average — same "recompute on create" idea as
        // Restaurant.rating in restaurantController.createReview, just via a
        // direct query instead of maintaining a redundant array on Courier.
        if (courierRating != null && order.courierId) {
            const courierRatings = await OrderRating.find({ courierId: order.courierId }).select("courierRating");
            const values = courierRatings
                .map(r => r.courierRating)
                .filter((v): v is number => v != null);
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            await Courier.findByIdAndUpdate(order.courierId, {
                rating: parseFloat(avg.toFixed(1)),
                ratingCount: values.length,
            });
        }

        res.status(201).json(newRating);
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};

export const getOrderRating = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    try {
        const rating = await OrderRating.findOne({ orderId: id, sender: (req as AuthRequest).userId });
        res.status(200).json(rating);
        return;
    } catch (err) {
        res.status(500).json("Server error!");
        return;
    }
};
