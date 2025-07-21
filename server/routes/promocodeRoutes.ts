import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { createPromocode, getPromocode, usePromocode } from "../controllers/promocodeController";

const promocodeRoute = express.Router();


promocodeRoute.post("/promocodes/:code",authMiddleware,getPromocode);
promocodeRoute.post("/promocodes",adminMiddleware,createPromocode);
promocodeRoute.post("/promocodes/:code/use",authMiddleware,usePromocode);


export default promocodeRoute;