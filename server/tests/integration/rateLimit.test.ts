import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../../app";

let mongo: MongoMemoryServer;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

describe("auth rate limiting", () => {
    it("throttles repeated login attempts from the same client", async () => {
        let sawLimited = false;
        // The limiter allows 20 requests per window — this file gets its own
        // fresh app instance (and therefore a fresh limiter store), so it won't
        // interfere with the login tests in auth.test.ts.
        for (let i = 0; i < 21; i++) {
            const res = await request(app).post("/api/auth/login").send({ username: "nobody", password: "wrong" });
            if (res.status === 429) {
                sawLimited = true;
                break;
            }
        }
        expect(sawLimited).toBe(true);
    });
});
