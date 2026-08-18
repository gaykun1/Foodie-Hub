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

// cron for deleting all caching promocodes in users every week
nodeCron.schedule("0 0 * * 1", async () => {
    // updateOne only ever touches a single matching document — with an empty
    // filter that meant one arbitrary user got cleared each week while every
    // other user kept stale (and, once Promocode's TTL index deletes the
    // underlying docs, dangling) promocode references indefinitely.
    await User.updateMany({}, { $set: { promocodes: null, usualPromocode: null } });
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