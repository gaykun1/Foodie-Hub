import express from "express"

import { addToCart,  getCart, updateCartAmount } from "../controllers/cartController";

const cartRoute = express.Router();

cartRoute.post("/add-item", addToCart);
cartRoute.get("/", getCart);
cartRoute.post("/change-amount",  updateCartAmount);

export default cartRoute;