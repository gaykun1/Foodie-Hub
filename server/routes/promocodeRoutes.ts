import express from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminMiddleware } from "../middleware/adminMiddleware";
import { createPromocode, getPromocode, usePromocode } from "../controllers/promocodeController";

const promocodeRoute = express.Router();


promocodeRoute.post("/get",authMiddleware,getPromocode);
promocodeRoute.post("/create",adminMiddleware,createPromocode);
promocodeRoute.post("/use",authMiddleware,usePromocode);


export default promocodeRoute;