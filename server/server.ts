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
import { Server } from "socket.io";
dotenv.config();
const app = express();

const server = http.createServer(app);

app.use(cookieParser())
app.use(express.json());

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        credentials: true
    }
})

io.on("connection", (socket) => {

    socket.on("updateLocation", ({ orderId, lat, lng }) => {
        io.to(orderId).emit("locationUpdate", { lat, lng });
    })

    socket.on("joinOrder", (orderId) => {
        socket.join(orderId);
    })
})


app.use(cors({
    origin: "http://localhost:3000",
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

app.use("/api/auth", authRoute);
app.use("/api/restaurant", restaurantRoute);
app.use("/api/cart", cartRoute);
app.use("/api/order", orderRoute);
app.use("/api/payment", payRoute);
app.use("/api/courier", courierRoute);

mongoose.connect(process.env.MONGO_URI!).then(() => console.log("MongoDB connected"))
    .catch(err => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

server.listen(process.env.PORT, () => {
    console.log(`server working on port ${process.env.PORT}`);
})