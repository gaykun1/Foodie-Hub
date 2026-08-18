import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../../app";
import User, { IUserDocument } from "../../models/User";
import Order, { IOrderDocument } from "../../models/Order";
import Courier, { ICourierDocument } from "../../models/Courier";
import OrderRating from "../../models/OrderRating";

let mongo: MongoMemoryServer;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

describe("order rating", () => {
    let user: IUserDocument;
    let userToken: string;
    let courierUser: IUserDocument;
    let courierProfile: ICourierDocument;
    let deliveredOrder: IOrderDocument;

    beforeEach(async () => {
        user = await User.create({ username: "ratingUser", password: "x" });
        userToken = jwt.sign({ userId: user._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });

        courierUser = await User.create({ username: "ratingCourier", password: "x", role: "courier" });
        courierProfile = await Courier.create({
            fullname: "Rating Courier", phoneNumber: "+380111000001", email: "ratingcourier@example.com",
            transport: "Bike", userId: courierUser._id, city: "Kyiv", age: 25, status: "Working",
        });

        deliveredOrder = await Order.create({
            userId: user._id,
            items: [{ title: "Burger", imageUrl: "img.jpg", price: 10, amount: 1 }],
            restaurantTitle: "Best Burger", restaurantImage: "img.jpg",
            approxTime: 15, totalPrice: 10, status: "Delivered", courierId: courierProfile._id,
        });
    });

    afterEach(async () => {
        await Order.deleteMany({});
        await User.deleteMany({});
        await Courier.deleteMany({});
        await OrderRating.deleteMany({});
    });

    describe("create rating", () => {
        it("submits a restaurant + courier rating and recomputes the courier's average", async () => {
            const res = await request(app).post(`/api/rating/orders/${deliveredOrder._id}/rating`)
                .set("Cookie", `token=${userToken}`)
                .send({ restaurantRating: 5, courierRating: 4, comment: "Great!" });

            expect(res.status).toBe(201);
            const savedCourier = await Courier.findById(courierProfile._id);
            expect(savedCourier?.rating).toBe(4);
            expect(savedCourier?.ratingCount).toBe(1);
        });

        it("submits a restaurant-only rating when courierRating is omitted", async () => {
            const res = await request(app).post(`/api/rating/orders/${deliveredOrder._id}/rating`)
                .set("Cookie", `token=${userToken}`)
                .send({ restaurantRating: 3 });

            expect(res.status).toBe(201);
            const savedCourier = await Courier.findById(courierProfile._id);
            expect(savedCourier?.rating).toBeNull();
        });

        it("averages multiple orders' courier ratings correctly", async () => {
            await request(app).post(`/api/rating/orders/${deliveredOrder._id}/rating`)
                .set("Cookie", `token=${userToken}`)
                .send({ restaurantRating: 5, courierRating: 2 });

            const secondOrder = await Order.create({
                userId: user._id,
                items: [{ title: "Burger", imageUrl: "img.jpg", price: 10, amount: 1 }],
                restaurantTitle: "Best Burger", restaurantImage: "img.jpg",
                approxTime: 15, totalPrice: 10, status: "Delivered", courierId: courierProfile._id,
            });
            await request(app).post(`/api/rating/orders/${secondOrder._id}/rating`)
                .set("Cookie", `token=${userToken}`)
                .send({ restaurantRating: 5, courierRating: 4 });

            const savedCourier = await Courier.findById(courierProfile._id);
            expect(savedCourier?.rating).toBe(3); // (2 + 4) / 2
            expect(savedCourier?.ratingCount).toBe(2);
        });

        it("409s before the order is Delivered", async () => {
            deliveredOrder.status = "Preparing";
            await deliveredOrder.save();

            const res = await request(app).post(`/api/rating/orders/${deliveredOrder._id}/rating`)
                .set("Cookie", `token=${userToken}`)
                .send({ restaurantRating: 5 });

            expect(res.status).toBe(409);
        });

        it("409s a second submission for the same order", async () => {
            await request(app).post(`/api/rating/orders/${deliveredOrder._id}/rating`)
                .set("Cookie", `token=${userToken}`)
                .send({ restaurantRating: 5 });

            const res = await request(app).post(`/api/rating/orders/${deliveredOrder._id}/rating`)
                .set("Cookie", `token=${userToken}`)
                .send({ restaurantRating: 1 });

            expect(res.status).toBe(409);
            expect(await OrderRating.countDocuments({ orderId: deliveredOrder._id })).toBe(1);
        });

        it("404s another user's order", async () => {
            const otherUser = await User.create({ username: "notTheRatingOwner", password: "x" });
            const otherToken = jwt.sign({ userId: otherUser._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });

            const res = await request(app).post(`/api/rating/orders/${deliveredOrder._id}/rating`)
                .set("Cookie", `token=${otherToken}`)
                .send({ restaurantRating: 5 });

            expect(res.status).toBe(404);
        });

        it("400s a courierRating when the order had no courier assigned", async () => {
            const noCourierOrder = await Order.create({
                userId: user._id,
                items: [{ title: "Burger", imageUrl: "img.jpg", price: 10, amount: 1 }],
                restaurantTitle: "Best Burger", restaurantImage: "img.jpg",
                approxTime: 15, totalPrice: 10, status: "Delivered", courierId: null,
            });

            const res = await request(app).post(`/api/rating/orders/${noCourierOrder._id}/rating`)
                .set("Cookie", `token=${userToken}`)
                .send({ restaurantRating: 5, courierRating: 5 });

            expect(res.status).toBe(400);
        });

        it("400s an out-of-range restaurant rating", async () => {
            const res = await request(app).post(`/api/rating/orders/${deliveredOrder._id}/rating`)
                .set("Cookie", `token=${userToken}`)
                .send({ restaurantRating: 6 });

            expect(res.status).toBe(400);
        });

        it("401s with no auth token", async () => {
            const res = await request(app).post(`/api/rating/orders/${deliveredOrder._id}/rating`).send({ restaurantRating: 5 });
            expect(res.status).toBe(401);
        });
    });

    describe("get rating", () => {
        it("returns null before a rating exists", async () => {
            const res = await request(app).get(`/api/rating/orders/${deliveredOrder._id}/rating`)
                .set("Cookie", `token=${userToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toBeNull();
        });

        it("returns the saved rating after submission", async () => {
            await request(app).post(`/api/rating/orders/${deliveredOrder._id}/rating`)
                .set("Cookie", `token=${userToken}`)
                .send({ restaurantRating: 5, comment: "Nice" });

            const res = await request(app).get(`/api/rating/orders/${deliveredOrder._id}/rating`)
                .set("Cookie", `token=${userToken}`);
            expect(res.status).toBe(200);
            expect(res.body.restaurantRating).toBe(5);
            expect(res.body.comment).toBe("Nice");
        });
    });
});
