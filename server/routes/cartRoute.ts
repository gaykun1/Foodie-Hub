import express from "express"
import { authMiddleware } from "../middleware/authMiddleware";
import { addToCart, getCart, updateCartAmount } from "../controllers/cartController";

const cartRoute = express.Router();

cartRoute.post("/add-to-cart", authMiddleware, addToCart);
cartRoute.get("/get-cart", authMiddleware, getCart);
cartRoute.post("/amount", authMiddleware, updateCartAmount);

export default cartRoute;