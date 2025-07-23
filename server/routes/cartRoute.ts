import express from "express"

import { addToCart,  getCart, updateCartAmount } from "../controllers/cartController";

const cartRoute = express.Router();

cartRoute.get("/", getCart);
cartRoute.post("/items", addToCart);
cartRoute.patch("/items/:id",  updateCartAmount);

export default cartRoute;