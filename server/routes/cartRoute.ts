import express from "express"

import { addToCart,  getCart, updateCartAmount } from "../controllers/cartController";

const cartRoute = express.Router();

cartRoute.post("/items", addToCart);
cartRoute.get("/", getCart);
cartRoute.patch("/items/:id",  updateCartAmount);

export default cartRoute;