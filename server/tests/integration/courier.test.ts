import request from "supertest";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { app } from "../../app";
import User, { IUserDocument } from "../../models/User";
import Order from "../../models/Order";
import Courier, { ICourierDocument } from "../../models/Courier";

let mongo: MongoMemoryServer;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

describe("courier order handling", () => {
    let courier: IUserDocument;
    let courierToken: string;
    let courierProfile: ICourierDocument;
    let otherCourier: IUserDocument;
    let otherCourierToken: string;
    let otherCourierProfile: ICourierDocument;

    // Order.courierId stores the Courier-application document's id, not the
    // User id — an existing convention this whole feature already relied on
    // (checkIfHasOrder, getOrdersCourier, and the client's own CourierOrderCard
    // all key off the Courier doc's _id), so every fixture here needs one.
    beforeEach(async () => {
        courier = await User.create({ username: "courier1", password: "x", role: "courier" });
        courierToken = jwt.sign({ userId: courier._id, role: "courier" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
        courierProfile = await Courier.create({
            fullname: "Courier One", phoneNumber: "+380000000001", email: "courier1@example.com",
            transport: "Bike", userId: courier._id, city: "Kyiv", age: 25, status: "Working",
        });

        otherCourier = await User.create({ username: "courier2", password: "x", role: "courier" });
        otherCourierToken = jwt.sign({ userId: otherCourier._id, role: "courier" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
        otherCourierProfile = await Courier.create({
            fullname: "Courier Two", phoneNumber: "+380000000002", email: "courier2@example.com",
            transport: "Car", userId: otherCourier._id, city: "Kyiv", age: 28, status: "Working",
        });
    });

    afterEach(async () => {
        await Order.deleteMany({});
        await User.deleteMany({});
        await Courier.deleteMany({});
    });

    const makeFreeOrder = () => Order.create({
        userId: new mongoose.Types.ObjectId(),
        items: [{ title: "Burger", imageUrl: "img.jpg", price: 10, amount: 1 }],
        restaurantTitle: "Best Burger",
        restaurantImage: "img.jpg",
        approxTime: 15,
        totalPrice: 10,
        status: "Preparing",
        courierId: null,
        address: { city: "Kyiv", countryOrRegion: "Ukraine", houseNumber: 1, street: "Street" },
    });

    describe("take order", () => {
        it("assigns the order to the authenticated courier's own profile, ignoring a spoofed courierId in the body", async () => {
            const order = await makeFreeOrder();
            const res = await request(app).post(`/api/courier/orders/${order._id}/take`)
                .set("Cookie", `token=${courierToken}`)
                .send({ courierId: otherCourierProfile._id }); // attacker-supplied, must be ignored

            expect(res.status).toBe(200);
            const saved = await Order.findById(order._id);
            expect(saved?.courierId?.toString()).toBe(courierProfile._id.toString());
        });

        it("404s (can't be taken) if the order is already assigned to another courier", async () => {
            const order = await makeFreeOrder();
            order.courierId = otherCourierProfile._id;
            await order.save();

            const res = await request(app).post(`/api/courier/orders/${order._id}/take`)
                .set("Cookie", `token=${courierToken}`)
                .send({});

            expect(res.status).toBe(404);
            const saved = await Order.findById(order._id);
            expect(saved?.courierId?.toString()).toBe(otherCourierProfile._id.toString());
        });

        it("404s a courier-role user with no Courier profile at all", async () => {
            const order = await makeFreeOrder();
            const rogueUser = await User.create({ username: "norecord", password: "x", role: "courier" });
            const rogueToken = jwt.sign({ userId: rogueUser._id, role: "courier" }, process.env.JWT_SECRET!, { expiresIn: "1h" });

            const res = await request(app).post(`/api/courier/orders/${order._id}/take`)
                .set("Cookie", `token=${rogueToken}`)
                .send({});

            expect(res.status).toBe(404);
            const saved = await Order.findById(order._id);
            expect(saved?.courierId).toBeNull();
        });

        it("401s with no auth token", async () => {
            const order = await makeFreeOrder();
            const res = await request(app).post(`/api/courier/orders/${order._id}/take`).send({});
            expect(res.status).toBe(401);
        });
    });

    describe("change order status", () => {
        it("lets the assigned courier update their own order", async () => {
            const order = await makeFreeOrder();
            order.courierId = courierProfile._id;
            await order.save();

            const res = await request(app).patch(`/api/courier/orders/${order._id}/status`)
                .set("Cookie", `token=${courierToken}`)
                .send({ status: "Delivering" });

            expect(res.status).toBe(200);
            const saved = await Order.findById(order._id);
            expect(saved?.status).toBe("Delivering");
        });

        it("403s a courier trying to update an order assigned to someone else", async () => {
            const order = await makeFreeOrder();
            order.courierId = otherCourierProfile._id;
            await order.save();

            const res = await request(app).patch(`/api/courier/orders/${order._id}/status`)
                .set("Cookie", `token=${courierToken}`)
                .send({ status: "Delivered" });

            expect(res.status).toBe(403);
            const saved = await Order.findById(order._id);
            expect(saved?.status).toBe("Preparing");
        });

        it("401s with no auth token", async () => {
            const order = await makeFreeOrder();
            const res = await request(app).patch(`/api/courier/orders/${order._id}/status`).send({ status: "Delivered" });
            expect(res.status).toBe(401);
        });
    });

    describe("check if has order", () => {
        it("finds the active order assigned to the caller's own courier profile", async () => {
            const order = await makeFreeOrder();
            order.courierId = courierProfile._id;
            await order.save();

            const res = await request(app).get("/api/courier/orders/status")
                .set("Cookie", `token=${courierToken}`);

            expect(res.status).toBe(200);
            expect(res.body?._id).toBe(order._id.toString());
        });

        it("doesn't leak another courier's active order", async () => {
            const order = await makeFreeOrder();
            order.courierId = otherCourierProfile._id;
            await order.save();

            const res = await request(app).get("/api/courier/orders/status")
                .set("Cookie", `token=${courierToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toBeNull();
        });

        it("401s with no auth token", async () => {
            const res = await request(app).get("/api/courier/orders/status");
            expect(res.status).toBe(401);
        });
    });
});
