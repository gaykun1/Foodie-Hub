import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// route import
import authRoute from "./routes/authRoutes";
import restaurantRoute from "./routes/restaurantRoute";
import cartRoute from "./routes/cartRoute";
import orderRoute from "./routes/orderRoutes";
import payRoute from "./routes/payRoutes";
import courierRoute from "./routes/courierRoutes";
import promocodeRoute from "./routes/promocodeRoutes";
import ratingRoute from "./routes/ratingRoutes";

import { authMiddleware } from "./middleware/authMiddleware";

dotenv.config();

export const app = express();
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Brute-force guard on credential-guessing endpoints — signup/login previously
// had no limit at all on attempts per IP.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);

// routing
app.use("/api/auth", authRoute);
app.use("/api/restaurant", restaurantRoute);
app.use("/api/cart", authMiddleware, cartRoute);
app.use("/api/order", orderRoute);
app.use("/api/payment", payRoute);
app.use("/api/courier", courierRoute);
app.use("/api/promocode", promocodeRoute);
app.use("/api/rating", ratingRoute);

//route for testing auth middleware
app.get("/api/protected",authMiddleware, async (req: Request, res: Response) => {
    return res.status(200).json("Route is protected");
})

// Lives here (not server.ts) so it's covered by the same app instance the
// test suite imports, and so a failed lookup doesn't fall through to
// Express's default HTML error page.
app.get("/api/geocode", async (req: Request, res: Response) => {
    const q = (req.query.q ?? '') as string;

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json`,
            // Nominatim's usage policy requires an identifying User-Agent, or it
            // may rate-limit/block requests — the previous request sent none.
            { headers: { "User-Agent": "FoodieHub/1.0" } }
        );
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(502).json({ message: "Geocoding service unavailable" });
    }
})


