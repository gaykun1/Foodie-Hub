import { Request, Response } from "express"
import http from "http"

import dotenv from "dotenv";
import mongoose from "mongoose";
// api routes

import User from "./models/User";
import Promocode from "./models/Promocode";
import nodeCron from "node-cron";
import { app } from "./app";
import { initSocket } from "./socket";
dotenv.config();


const server = http.createServer(app);

// initting socket with all logic and maps,sets
initSocket(server);

// api for geocoding
app.get("/api/geocode", async (req: Request, res: Response) => {
    const q = (req.query.q ?? '') as string;

    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json`
    );
    const data = await response.json();
    res.json(data);
})


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