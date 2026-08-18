import express from "express"
import { authMiddleware } from "../middleware/authMiddleware";
import { createOrderRating, getOrderRating } from "../controllers/ratingController";

const ratingRoute = express.Router();

ratingRoute.post("/orders/:id/rating", authMiddleware, createOrderRating);
ratingRoute.get("/orders/:id/rating", authMiddleware, getOrderRating);

export default ratingRoute;
