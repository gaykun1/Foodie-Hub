import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../../app";
import User, { IUserDocument } from "../../models/User";
import Order, { IOrderDocument } from "../../models/Order";
import Dish, { IDishDocument } from "../../models/Dish";
import Restaurant, { Category, IRestaurantDocument } from "../../models/Restaurant";
import { stripe } from "../../utils/stripeClient";

let mongo: MongoMemoryServer;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

describe("order cancellation + refund", () => {
    let user: IUserDocument;
    let userToken: string;
    let restaurantUser: IUserDocument;
    let restaurantToken: string;
    let admin: IUserDocument;
    let adminToken: string;
    let restaurant: IRestaurantDocument;
    let dish: IDishDocument;
    let order: IOrderDocument;

    beforeEach(async () => {
        user = await User.create({ username: "cancelUser", password: "x" });
        userToken = jwt.sign({ userId: user._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });

        restaurant = await Restaurant.create({
            title: "Best Burger", dishes: [], description: "Cool restaurant", imageUrl: "img.jpg",
            categories: [Category.FastFood], adress: { street: "Street", city: "city", houseNumber: 4 },
            startDay: "Monday", endDay: "Monday", endHour: "6:00", startHour: "6:00",
            websiteUrl: "site.com", phone: "+312421412",
        });
        restaurantUser = await User.create({ username: "cancelRestaurantOwner", password: "x", role: "restaurant", restaurantId: restaurant._id });
        restaurantToken = jwt.sign({ userId: restaurantUser._id, role: "restaurant" }, process.env.JWT_SECRET!, { expiresIn: "1h" });

        admin = await User.create({ username: "cancelAdmin", password: "x", role: "admin" });
        adminToken = jwt.sign({ userId: admin._id, role: "admin" }, process.env.JWT_SECRET!, { expiresIn: "1h" });

        dish = await Dish.create({
            title: "Cancel Burger", description: "Tasty", imageUrl: "img.jpg", price: 10,
            restaurantId: restaurant._id, typeOfFood: "Main Courses", sold: 5,
        });

        order = await Order.create({
            userId: user._id,
            items: [{ title: dish.title, imageUrl: dish.imageUrl, price: dish.price, amount: 2 }],
            restaurantTitle: restaurant.title,
            restaurantImage: restaurant.imageUrl,
            approxTime: 15,
            totalPrice: 20,
            status: "Created",
            paymentIntentId: "pi_test_cancel_123",
            courierId: null,
        });
    });

    afterEach(async () => {
        await Order.deleteMany({});
        await User.deleteMany({});
        await Restaurant.deleteMany({});
        await Dish.deleteMany({});
        jest.restoreAllMocks();
    });

    describe("customer cancellation", () => {
        it("refunds via Stripe and cancels while status is Created", async () => {
            const refundSpy = jest.spyOn(stripe.refunds, "create").mockResolvedValueOnce({ id: "re_test_1" } as any);

            const res = await request(app).patch(`/api/order/orders/${order._id}/cancel`)
                .set("Cookie", `token=${userToken}`)
                .send({ reason: "Changed my mind" });

            expect(res.status).toBe(200);
            expect(refundSpy).toHaveBeenCalledWith({ payment_intent: "pi_test_cancel_123" });

            const saved = await Order.findById(order._id);
            expect(saved?.status).toBe("Cancelled");
            expect(saved?.cancelledBy).toBe("customer");
            expect(saved?.refundId).toBe("re_test_1");
            expect(saved?.refundedAt).not.toBeNull();

            const savedDish = await Dish.findById(dish._id);
            expect(savedDish?.sold).toBe(3); // 5 - 2 (reversed)
        });

        it("409s once the restaurant has started preparing it", async () => {
            order.status = "Preparing";
            await order.save();

            const res = await request(app).patch(`/api/order/orders/${order._id}/cancel`)
                .set("Cookie", `token=${userToken}`)
                .send({});

            expect(res.status).toBe(409);
            const saved = await Order.findById(order._id);
            expect(saved?.status).toBe("Preparing");
        });

        it("404s another user's order", async () => {
            const otherUser = await User.create({ username: "notTheOwner", password: "x" });
            const otherToken = jwt.sign({ userId: otherUser._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });

            const res = await request(app).patch(`/api/order/orders/${order._id}/cancel`)
                .set("Cookie", `token=${otherToken}`)
                .send({});

            expect(res.status).toBe(404);
        });

        it("leaves the order untouched if the Stripe refund fails", async () => {
            jest.spyOn(stripe.refunds, "create").mockRejectedValueOnce(new Error("Stripe outage"));

            const res = await request(app).patch(`/api/order/orders/${order._id}/cancel`)
                .set("Cookie", `token=${userToken}`)
                .send({});

            expect(res.status).toBe(502);
            const saved = await Order.findById(order._id);
            expect(saved?.status).toBe("Created");
            expect(saved?.refundId).toBeNull();
        });

        it("401s with no auth token", async () => {
            const res = await request(app).patch(`/api/order/orders/${order._id}/cancel`).send({});
            expect(res.status).toBe(401);
        });
    });

    describe("restaurant cancellation", () => {
        it("cancels its own order while Created or Preparing", async () => {
            jest.spyOn(stripe.refunds, "create").mockResolvedValueOnce({ id: "re_test_2" } as any);
            order.status = "Preparing";
            await order.save();

            const res = await request(app).patch(`/api/order/orders/${order._id}/cancel/restaurant`)
                .set("Cookie", `token=${restaurantToken}`)
                .send({ reason: "Out of stock" });

            expect(res.status).toBe(200);
            const saved = await Order.findById(order._id);
            expect(saved?.status).toBe("Cancelled");
            expect(saved?.cancelledBy).toBe("restaurant");
        });

        it("404s an order belonging to a different restaurant", async () => {
            const otherRestaurant = await Restaurant.create({
                title: "Other Place", dishes: [], description: "Other", imageUrl: "img.jpg",
                categories: [Category.FastFood], adress: { street: "St", city: "city", houseNumber: 1 },
                startDay: "Monday", endDay: "Monday", endHour: "6:00", startHour: "6:00",
                websiteUrl: "site.com", phone: "+312421413",
            });
            const otherOwner = await User.create({ username: "otherOwnerCancel", password: "x", role: "restaurant", restaurantId: otherRestaurant._id });
            const otherToken = jwt.sign({ userId: otherOwner._id, role: "restaurant" }, process.env.JWT_SECRET!, { expiresIn: "1h" });

            const res = await request(app).patch(`/api/order/orders/${order._id}/cancel/restaurant`)
                .set("Cookie", `token=${otherToken}`)
                .send({});

            expect(res.status).toBe(404);
        });

        it("409s once the order is out for delivery", async () => {
            order.status = "Delivering";
            await order.save();

            const res = await request(app).patch(`/api/order/orders/${order._id}/cancel/restaurant`)
                .set("Cookie", `token=${restaurantToken}`)
                .send({});

            expect(res.status).toBe(409);
        });
    });

    describe("admin cancellation", () => {
        it("cancels any order up through Delivering", async () => {
            jest.spyOn(stripe.refunds, "create").mockResolvedValueOnce({ id: "re_test_3" } as any);
            order.status = "Delivering";
            await order.save();

            const res = await request(app).patch(`/api/order/orders/${order._id}/cancel/admin`)
                .set("Cookie", `token=${adminToken}`)
                .send({ reason: "Customer dispute" });

            expect(res.status).toBe(200);
            const saved = await Order.findById(order._id);
            expect(saved?.status).toBe("Cancelled");
            expect(saved?.cancelledBy).toBe("admin");
        });

        it("409s an already-delivered order", async () => {
            order.status = "Delivered";
            await order.save();

            const res = await request(app).patch(`/api/order/orders/${order._id}/cancel/admin`)
                .set("Cookie", `token=${adminToken}`)
                .send({});

            expect(res.status).toBe(409);
        });

        it("403s a non-admin", async () => {
            const res = await request(app).patch(`/api/order/orders/${order._id}/cancel/admin`)
                .set("Cookie", `token=${userToken}`)
                .send({});
            expect(res.status).toBe(403);
        });
    });

    describe("getNumbers revenue stats exclude cancelled orders", () => {
        it("does not count a cancelled order's total toward revenue", async () => {
            jest.spyOn(stripe.refunds, "create").mockResolvedValueOnce({ id: "re_test_4" } as any);
            // A second, still-active order so the stats endpoint has something to report.
            await Order.create({
                userId: user._id,
                items: [{ title: dish.title, imageUrl: dish.imageUrl, price: dish.price, amount: 1 }],
                restaurantTitle: restaurant.title, restaurantImage: restaurant.imageUrl,
                approxTime: 15, totalPrice: 10, status: "Delivered", courierId: null,
            });

            await request(app).patch(`/api/order/orders/${order._id}/cancel`)
                .set("Cookie", `token=${userToken}`)
                .send({});

            const res = await request(app).get("/api/order/orders/statistics")
                .set("Cookie", `token=${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.numOfOrders.number).toBe(1);
            expect(res.body.totalRevenue.number).toBe(10);
        });
    });
});
