// Must precede the `app` import (and its transitive import of payController,
// which constructs a real Stripe client at module load time).
jest.mock("stripe", () => {
    return jest.fn().mockImplementation(() => ({
        paymentIntents: {
            create: jest.fn(async (params: { amount: number }) => ({
                client_secret: "test_client_secret",
                amount: params.amount,
            })),
        },
    }));
});

import Stripe from "stripe";
import request from "supertest";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { app } from "../../app";
import User, { IUserDocument } from "../../models/User";
import Order from "../../models/Order";

let mongo: MongoMemoryServer;
// Stripe is constructed exactly once, at payController's module-load time, so
// its mock.results entry must be captured before any afterEach clears mock state.
const stripeInstance = (Stripe as unknown as jest.Mock).mock.results[0].value;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

describe("payment intent (checkout charge amount)", () => {
    let user: IUserDocument;
    let token: string;

    beforeEach(async () => {
        user = await User.create({ username: "paytestuser", password: "x" });
        token = jwt.sign({ userId: user._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
        await Order.create({
            userId: user._id,
            items: [{ title: "Burger", imageUrl: "img.jpg", price: 10, amount: 2 }],
            restaurantTitle: "Best Burger",
            restaurantImage: "img.jpg",
            approxTime: 0,
            totalPrice: 20,
            status: null,
            courierId: null,
        });
    });

    afterEach(async () => {
        await Order.deleteMany({});
        await User.deleteMany({});
        stripeInstance.paymentIntents.create.mockClear();
    });

    it("401s with no auth token", async () => {
        const res = await request(app).post("/api/payment/payment-intent").send({ shipping: 2.2, percent: 0 });
        expect(res.status).toBe(401);
    });

    it("charges the server-computed total, ignoring a client-inflated discount percent", async () => {
        const res = await request(app)
            .post("/api/payment/payment-intent")
            .set("Cookie", `token=${token}`)
            .send({ shipping: 2.2, percent: 90 }); // user holds no promocode entitlement

        expect(res.status).toBe(200);
        // subtotal 20 + shipping 2.2 = 22.2, discount clamped to 0% => 2220 cents
        expect(stripeInstance.paymentIntents.create).toHaveBeenCalledWith(
            expect.objectContaining({ amount: 2220 })
        );
    });

    it("rejects a shipping price outside the whitelisted options, without leaking the raw internal error", async () => {
        const res = await request(app)
            .post("/api/payment/payment-intent")
            .set("Cookie", `token=${token}`)
            .send({ shipping: 0.01, percent: 0 });

        expect(res.status).toBe(400);
        // Used to interpolate the caught error straight into the response
        // ("Failed: Error: Invalid shipping option") — internal exception
        // detail a client has no business seeing.
        expect(res.body.message).not.toMatch(/error:/i);
    });

    it("doesn't leak Stripe's internal error details into the response", async () => {
        stripeInstance.paymentIntents.create.mockImplementationOnce(() => {
            throw new Error("Invalid API Key provided: sk_test_***");
        });

        const res = await request(app)
            .post("/api/payment/payment-intent")
            .set("Cookie", `token=${token}`)
            .send({ shipping: 2.2, percent: 0 });

        expect(res.status).toBe(400);
        expect(res.body.message).not.toMatch(/API Key|sk_test/i);
    });

    it("404s when the user has no pending order to charge for", async () => {
        await Order.deleteMany({});
        const res = await request(app)
            .post("/api/payment/payment-intent")
            .set("Cookie", `token=${token}`)
            .send({ shipping: 2.2, percent: 0 });

        expect(res.status).toBe(404);
    });
});
