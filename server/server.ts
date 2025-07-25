import express, { Request, Response } from "express"
import http from "http"
import cors from "cors"
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
// api routes
import authRoute from "./routes/authRoutes";
import restaurantRoute from "./routes/restaurantRoute";
import cartRoute from "./routes/cartRoute";
import orderRoute from "./routes/orderRoutes";
import payRoute from "./routes/payRoutes";
import courierRoute from "./routes/courierRoutes";
const { Server }  = require('socket.io');
import { authMiddleware } from "./middleware/authMiddleware";
import User from "./models/User";
import Promocode from "./models/Promocode";
import nodeCron from "node-cron";
import promocodeRoute from "./routes/promocodeRoutes";
import { Socket } from "socket.io";
dotenv.config();
const app = express();

const server = http.createServer(app);

app.use(cookieParser());
app.use(express.json());

export const io = new Server(server, {
    cors: {
        origin:process.env.CORS_ORIGIN,
        credentials: true
    }
});

// Map for sockets
export let socketsMap = new Map<string, Socket>();

// Set for active admins
export const activeAdmins = new Set<string>();

export let restaurantsSocketsMap = new Map<string, Socket>();
io.on("connection", (socket:Socket) => {
    // updating location
    socket.on("updateLocation", ({ orderId, lat, lng }:{orderId:string, lat:number, lng:number}) => {
        io.to(orderId).emit("locationUpdate", { lat, lng });
    })
    // room for courier and receiver
    socket.on("joinOrder", ({ orderId, userId }: { orderId: string, userId: string }) => {
        socket.join(orderId);
        socketsMap.set(userId, socket);

    })

    // rooms for dashboard roles
    socket.on("joinDashboard", (adminId:string) => {
        socket.join(adminId);
        socketsMap.set(adminId, socket);
        activeAdmins.add(adminId);
    })
    socket.on("joinDashboardRestaurant", (restaurantId:string) => {
        socket.join(restaurantId);
        restaurantsSocketsMap.set(restaurantId, socket);
    })


    socket.on("disconnect", () => {
        socketsMap.forEach((value, key) => {
            if (value === socket) {
                socketsMap.delete(key);
                activeAdmins.delete(key);
            }
        })
    })
})

// cors for express server
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true,
}));

// api for geocoding
app.get("/api/geocode", async (req: Request, res: Response) => {
    const q = (req.query.q ?? '') as string;

    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json`
    );
    const data = await response.json();
    res.json(data);
})

// apis
app.use("/api/auth", authRoute);
app.use("/api/restaurant", restaurantRoute); 
app.use("/api/cart", authMiddleware, cartRoute);
app.use("/api/order", orderRoute);
app.use("/api/payment", payRoute);
app.use("/api/courier", courierRoute);
app.use("/api/promocode", promocodeRoute);

// cron for deleting all caching promocodes in users every week
nodeCron.schedule("0 0 * * 1", async () => {
    await User.updateOne({}, { $set: { promocodes: null, usualPromocode: null } });
    await Promocode.deleteMany({});
})

mongoose.connect(process.env.MONGO_URI!).then(() => console.log("MongoDB connected"))
    .catch(err => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

server.listen(process.env.PORT, () => {
    console.log(`server working on port ${process.env.PORT}`);
})