import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../../app";
import User, { IUserDocument } from "../../models/User";
import Order, { IOrderDocument } from "../../models/Order";
import Dish, { IDishDocument } from "../../models/Dish";
import Restaurant, { Category, IRestaurantDocument } from "../../models/Restaurant";
import Courier from "../../models/Courier";
import { stripe } from "../../utils/stripeClient";
import { resend } from "../../utils/emailClient";

let mongo: MongoMemoryServer;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

describe("order email notifications", () => {
    let user: IUserDocument;
    let userToken: string;
    let restaurant: IRestaurantDocument;
    let dish: IDishDocument;

    beforeEach(async () => {
        user = await User.create({ username: "emailUser", password: "x", email: "customer@example.com" });
        userToken = jwt.sign({ userId: user._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });

        restaurant = await Restaurant.create({
            title: "Best Burger", dishes: [], description: "Cool restaurant", imageUrl: "img.jpg",
            categories: [Category.FastFood], address: { street: "Street", city: "city", houseNumber: 4 },
            startDay: "Monday", endDay: "Monday", endHour: "6:00", startHour: "6:00",
            websiteUrl: "site.com", phone: "+312421412",
        });
        dish = await Dish.create({
            title: "Email Burger", description: "Tasty", imageUrl: "img.jpg", price: 10,
            restaurantId: restaurant._id, typeOfFood: "Main Courses",
        });
    });

    afterEach(async () => {
        await Order.deleteMany({});
        await User.deleteMany({});
        await Restaurant.deleteMany({});
        await Dish.deleteMany({});
        await Courier.deleteMany({});
        (resend.emails.send as jest.Mock).mockClear();
        jest.restoreAllMocks();
    });

    describe("checkout confirmation", () => {
        const validFormData = { city: "Kyiv", countryOrRegion: "Ukraine", houseNumber: "3", street: "Shevchenko", name: "A", surname: "B" };

        it("sends exactly one confirmation email to the order's user", async () => {
            await Order.create({
                userId: user._id,
                items: [{ title: dish.title, imageUrl: dish.imageUrl, price: dish.price, amount: 1 }],
                restaurantTitle: restaurant.title, restaurantImage: restaurant.imageUrl,
                approxTime: 0, totalPrice: 10, status: null, courierId: null,
            });
            jest.spyOn(stripe.paymentIntents, "retrieve").mockResolvedValueOnce({ status: "succeeded", amount: 1220 } as any);

            const res = await request(app).patch("/api/order/orders")
                .set("Cookie", `token=${userToken}`)
                .send({ formData: validFormData, shipping: 2.2, cartId: new mongoose.Types.ObjectId(), percent: 0, paymentIntentId: "pi_email_1" });

            expect(res.status).toBe(200);
            expect(resend.emails.send).toHaveBeenCalledTimes(1);
            expect(resend.emails.send).toHaveBeenCalledWith(expect.objectContaining({ to: "customer@example.com" }));
        });

        it("sends no email (and still succeeds) when the user has no email on file", async () => {
            const noEmailUser = await User.create({ username: "noEmailUser", password: "x" });
            const noEmailToken = jwt.sign({ userId: noEmailUser._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
            await Order.create({
                userId: noEmailUser._id,
                items: [{ title: dish.title, imageUrl: dish.imageUrl, price: dish.price, amount: 1 }],
                restaurantTitle: restaurant.title, restaurantImage: restaurant.imageUrl,
                approxTime: 0, totalPrice: 10, status: null, courierId: null,
            });
            jest.spyOn(stripe.paymentIntents, "retrieve").mockResolvedValueOnce({ status: "succeeded", amount: 1220 } as any);

            const res = await request(app).patch("/api/order/orders")
                .set("Cookie", `token=${noEmailToken}`)
                .send({ formData: validFormData, shipping: 2.2, cartId: new mongoose.Types.ObjectId(), percent: 0, paymentIntentId: "pi_email_2" });

            expect(res.status).toBe(200);
            expect(resend.emails.send).not.toHaveBeenCalled();
        });

        it("still succeeds even if the email provider rejects (fire-and-forget isolation)", async () => {
            await Order.create({
                userId: user._id,
                items: [{ title: dish.title, imageUrl: dish.imageUrl, price: dish.price, amount: 1 }],
                restaurantTitle: restaurant.title, restaurantImage: restaurant.imageUrl,
                approxTime: 0, totalPrice: 10, status: null, courierId: null,
            });
            jest.spyOn(stripe.paymentIntents, "retrieve").mockResolvedValueOnce({ status: "succeeded", amount: 1220 } as any);
            (resend.emails.send as jest.Mock).mockRejectedValueOnce(new Error("provider outage"));

            const res = await request(app).patch("/api/order/orders")
                .set("Cookie", `token=${userToken}`)
                .send({ formData: validFormData, shipping: 2.2, cartId: new mongoose.Types.ObjectId(), percent: 0, paymentIntentId: "pi_email_3" });

            expect(res.status).toBe(200);
        });
    });

    describe("courier status-update emails", () => {
        // Each target status is reached from its legal predecessor — the courier
        // status endpoint now validates transitions, so an order cannot jump
        // straight from "Created" to "Delivered".
        const previousStatus: Record<string, "Created" | "Preparing" | "Delivering"> = {
            Preparing: "Created",
            Delivering: "Preparing",
            Delivered: "Delivering",
        };

        it.each(["Preparing", "Delivering", "Delivered"])("sends a status-update email when a courier sets status to %s", async (status) => {
            const courierUser = await User.create({ username: `courierEmail_${status}`, password: "x", role: "courier" });
            const courierToken = jwt.sign({ userId: courierUser._id, role: "courier" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
            const courierDoc = await Courier.create({
                fullname: "Email Courier", phoneNumber: `+38012300${status.length}00`, email: `courier_${status}@example.com`,
                transport: "Bike", userId: courierUser._id, city: "Kyiv", age: 25, status: "Working",
            });
            const order = await Order.create({
                userId: user._id,
                items: [{ title: dish.title, imageUrl: dish.imageUrl, price: dish.price, amount: 1 }],
                restaurantTitle: restaurant.title, restaurantImage: restaurant.imageUrl,
                approxTime: 15, totalPrice: 10, status: previousStatus[status], courierId: courierDoc._id,
            });

            const res = await request(app).patch(`/api/courier/orders/${order._id}/status`)
                .set("Cookie", `token=${courierToken}`)
                .send({ status });

            expect(res.status).toBe(200);
            expect(resend.emails.send).toHaveBeenCalledTimes(1);
            expect(resend.emails.send).toHaveBeenCalledWith(expect.objectContaining({ to: "customer@example.com" }));
        });
    });

    describe("cancellation email", () => {
        it("sends a cancellation email once the refund succeeds", async () => {
            const order = await Order.create({
                userId: user._id,
                items: [{ title: dish.title, imageUrl: dish.imageUrl, price: dish.price, amount: 1 }],
                restaurantTitle: restaurant.title, restaurantImage: restaurant.imageUrl,
                approxTime: 15, totalPrice: 10, status: "Created", paymentIntentId: "pi_email_cancel", courierId: null,
            });
            jest.spyOn(stripe.refunds, "create").mockResolvedValueOnce({ id: "re_email_1" } as any);

            const res = await request(app).patch(`/api/order/orders/${order._id}/cancel`)
                .set("Cookie", `token=${userToken}`)
                .send({});

            expect(res.status).toBe(200);
            expect(resend.emails.send).toHaveBeenCalledTimes(1);
            expect(resend.emails.send).toHaveBeenCalledWith(expect.objectContaining({ to: "customer@example.com" }));
        });
    });
});
