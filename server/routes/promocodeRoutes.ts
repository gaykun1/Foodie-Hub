import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { createPromocode, getPromocode } from "../controllers/promocodeController";

const promocodeRoute = express.Router();


promocodeRoute.post("/get",authMiddleware,getPromocode);
promocodeRoute.post("/create",adminMiddleware,createPromocode);


export default promocodeRoute;