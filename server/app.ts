import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

// route import
import authRoute from "./routes/authRoutes";
import restaurantRoute from "./routes/restaurantRoute";
import cartRoute from "./routes/cartRoute";
import orderRoute from "./routes/orderRoutes";
import payRoute from "./routes/payRoutes";
import courierRoute from "./routes/courierRoutes";
import promocodeRoute from "./routes/promocodeRoutes";

import { authMiddleware } from "./middleware/authMiddleware";

dotenv.config();

export const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// routing
app.use("/api/auth", authRoute);
app.use("/api/restaurant", restaurantRoute);
app.use("/api/cart", authMiddleware, cartRoute);
app.use("/api/order", orderRoute);
app.use("/api/payment", payRoute);
app.use("/api/courier", courierRoute);
app.use("/api/promocode", promocodeRoute);

//route for testing auth middleware 
app.get("/api/protected",authMiddleware, async (req: Request, res: Response) => {
    return res.status(200).json("Route is protected");
})


