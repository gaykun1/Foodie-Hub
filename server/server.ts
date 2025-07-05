import express from "express"
import http from "http"
import cors from "cors"
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoute from "./routes/authRoutes";
import restaurantRoute from "./routes/restaurantRoute";
dotenv.config();
const app = express();

const server = http.createServer(app);

app.use(cookieParser())
app.use(express.json());


app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}))


app.use("/api/auth", authRoute);
app.use("/api/restaurant", restaurantRoute);

mongoose.connect(process.env.MONGO_URI!).then(() => console.log("MongoDB connected"))
    .catch(err => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

server.listen(process.env.PORT, () => {
    console.log(`server working on port ${process.env.PORT}`);
})