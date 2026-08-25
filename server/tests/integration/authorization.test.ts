import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../../app";
import User, { IUserDocument } from "../../models/User";
import Restaurant, { Category, IRestaurantDocument } from "../../models/Restaurant";
import Dish, { IDishDocument } from "../../models/Dish";
import Order, { IOrderDocument } from "../../models/Order";
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

const tokenFor = (user: IUserDocument) =>
    jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "1h" });

/**
 * Role boundaries, asserted as a matrix rather than one happy path per feature.
 *
 * Most of the security-relevant bugs in this codebase were of the form "the
 * endpoint checks *a* role but trusts a client-supplied id for *which*
 * resource" — a courier reading another courier's orders, a restaurant
 * cancelling someone else's order. These tests cover both axes: wrong role, and
 * right role but wrong resource.
 */
describe("authorization by role", () => {
    let customer: IUserDocument, customerToken: string;
    let otherCustomer: IUserDocument, otherCustomerToken: string;
    let owner: IUserDocument, ownerToken: string;
    let otherOwner: IUserDocument, otherOwnerToken: string;
    let courierUser: IUserDocument, courierToken: string;
    let otherCourierUser: IUserDocument, otherCourierToken: string;
    let admin: IUserDocument, adminToken: string;

    let restaurant: IRestaurantDocument;
    let otherRestaurant: IRestaurantDocument;
    let dish: IDishDocument;
    let courier: ICourierDocument;
    let otherCourier: ICourierDocument;
    let order: IOrderDocument;

    beforeEach(async () => {
        await Promise.all([
            User.deleteMany({}), Restaurant.deleteMany({}), Dish.deleteMany({}),
            Order.deleteMany({}), Courier.deleteMany({}),
        ]);

        restaurant = await Restaurant.create({
            title: "Role Grill", dishes: [], description: "d", imageUrl: "img.jpg",
            categories: [Category.FastFood], address: { street: "S", city: "Kyiv", houseNumber: 1 },
            startDay: "Monday", endDay: "Sunday", startHour: "9:00", endHour: "22:00",
            websiteUrl: "s.com", phone: "+3800001",
        });
        otherRestaurant = await Restaurant.create({
            title: "Rival Grill", dishes: [], description: "d", imageUrl: "img.jpg",
            categories: [Category.FastFood], address: { street: "S", city: "Kyiv", houseNumber: 2 },
            startDay: "Monday", endDay: "Sunday", startHour: "9:00", endHour: "22:00",
            websiteUrl: "s.com", phone: "+3800002",
        });

        customer = await User.create({ username: "roleCustomer", password: "x", role: "user" });
        otherCustomer = await User.create({ username: "roleOtherCustomer", password: "x", role: "user" });
        owner = await User.create({ username: "roleOwner", password: "x", role: "restaurant", restaurantId: restaurant._id });
        otherOwner = await User.create({ username: "roleOtherOwner", password: "x", role: "restaurant", restaurantId: otherRestaurant._id });
        courierUser = await User.create({ username: "roleCourier", password: "x", role: "courier" });
        otherCourierUser = await User.create({ username: "roleOtherCourier", password: "x", role: "courier" });
        admin = await User.create({ username: "roleAdmin", password: "x", role: "admin" });

        customerToken = tokenFor(customer);
        otherCustomerToken = tokenFor(otherCustomer);
        ownerToken = tokenFor(owner);
        otherOwnerToken = tokenFor(otherOwner);
        courierToken = tokenFor(courierUser);
        otherCourierToken = tokenFor(otherCourierUser);
        adminToken = tokenFor(admin);

        dish = await Dish.create({
            title: "Role Burger", description: "d", imageUrl: "img.jpg", price: 10,
            restaurantId: restaurant._id, typeOfFood: "Main Courses", sold: 0,
        });

        courier = await Courier.create({
            fullname: "Main Courier", phoneNumber: "+380111111", email: "c1@example.com",
            transport: "Bike", userId: courierUser._id, city: "Kyiv", age: 25, status: "Working",
        });
        otherCourier = await Courier.create({
            fullname: "Other Courier", phoneNumber: "+380222222", email: "c2@example.com",
            transport: "Car", userId: otherCourierUser._id, city: "Kyiv", age: 30, status: "Working",
        });

        order = await Order.create({
            userId: customer._id,
            items: [{ title: dish.title, imageUrl: dish.imageUrl, price: dish.price, amount: 1 }],
            restaurantTitle: restaurant.title, restaurantImage: restaurant.imageUrl,
            approxTime: 30, totalPrice: 10, shippingPrice: 2.2, status: "Preparing",
            address: { city: "Kyiv", countryOrRegion: "Ukraine", street: "S", houseNumber: 1 },
            courierId: courier._id,
        });
    });

    describe("admin-only surfaces", () => {
        const adminOnly = () => [
            ["platform statistics", "get", "/api/order/orders/statistics"],
            ["recent orders across the platform", "get", "/api/order/orders/recent"],
            ["the courier application queue", "get", "/api/courier/applications"],
            ["recent reviews across the platform", "get", "/api/restaurant/restaurants/reviews/recent"],
        ] as const;

        it.each(adminOnly())("lets an admin read %s", async (_label, method, path) => {
            const res = await request(app)[method](path).set("Cookie", `token=${adminToken}`);
            expect(res.status).not.toBe(403);
            expect(res.status).not.toBe(401);
        });

        it.each(adminOnly())("refuses a plain customer %s", async (_label, method, path) => {
            const res = await request(app)[method](path).set("Cookie", `token=${customerToken}`);
            expect(res.status).toBe(403);
        });

        it.each(adminOnly())("refuses a courier %s", async (_label, method, path) => {
            const res = await request(app)[method](path).set("Cookie", `token=${courierToken}`);
            expect(res.status).toBe(403);
        });

        it("refuses a restaurant owner the platform-wide application queue", async () => {
            const res = await request(app).get("/api/courier/applications").set("Cookie", `token=${ownerToken}`);
            expect(res.status).toBe(403);
        });

        it("only an admin may approve a courier application", async () => {
            const pending = await Courier.create({
                fullname: "Pending", phoneNumber: "+380333333", email: "p@example.com",
                transport: "Bike", userId: otherCustomer._id, city: "Kyiv", age: 22, status: "Processing",
            });

            const asCustomer = await request(app)
                .post(`/api/courier/applications/${pending._id}`)
                .set("Cookie", `token=${customerToken}`)
                .send({ status: "accepted" });
            expect(asCustomer.status).toBe(403);

            const asAdmin = await request(app)
                .post(`/api/courier/applications/${pending._id}`)
                .set("Cookie", `token=${adminToken}`)
                .send({ status: "accepted" });
            expect(asAdmin.status).toBe(200);
        });
    });

    describe("courier surfaces", () => {
        it("refuses a plain customer the free-orders board", async () => {
            const res = await request(app).get("/api/order/free-orders/Kyiv").set("Cookie", `token=${customerToken}`);
            expect(res.status).toBe(403);
        });

        it("scopes a courier's order history to their own deliveries", async () => {
            const mine = await request(app).get("/api/order/couriers/orders").set("Cookie", `token=${courierToken}`);
            expect(mine.status).toBe(200);
            expect(mine.body).toHaveLength(1);

            // The other courier has no assignments, so they see nothing —
            // crucially, not this courier's order.
            const theirs = await request(app).get("/api/order/couriers/orders").set("Cookie", `token=${otherCourierToken}`);
            expect(theirs.status).toBe(404);
        });

        it("refuses a courier who is not assigned to the order any status change", async () => {
            const res = await request(app)
                .patch(`/api/courier/orders/${order._id}/status`)
                .set("Cookie", `token=${otherCourierToken}`)
                .send({ status: "Delivering" });

            expect(res.status).toBe(403);
            expect((await Order.findById(order._id))?.status).toBe("Preparing");
        });

        it("lets the assigned courier advance their own order", async () => {
            const res = await request(app)
                .patch(`/api/courier/orders/${order._id}/status`)
                .set("Cookie", `token=${courierToken}`)
                .send({ status: "Delivering" });

            expect(res.status).toBe(200);
            expect((await Order.findById(order._id))?.status).toBe("Delivering");
        });

        it("reports only the caller's own current delivery", async () => {
            const mine = await request(app).get("/api/courier/orders/status").set("Cookie", `token=${courierToken}`);
            expect(mine.body?._id).toBe(order._id.toString());

            const theirs = await request(app).get("/api/courier/orders/status").set("Cookie", `token=${otherCourierToken}`);
            expect(theirs.body).toBeNull();
        });
    });

    describe("restaurant surfaces", () => {
        it("refuses a customer the incoming-orders queue", async () => {
            const res = await request(app)
                .get(`/api/order/orders/${restaurant._id}/created`)
                .set("Cookie", `token=${customerToken}`);
            expect(res.status).toBe(403);
        });

        it("refuses one restaurant the right to cancel another's order", async () => {
            const res = await request(app)
                .patch(`/api/order/orders/${order._id}/cancel/restaurant`)
                .set("Cookie", `token=${otherOwnerToken}`)
                .send({ reason: "not mine" });

            // Resolved from the caller's own restaurant, so a rival simply does
            // not see this order at all.
            expect(res.status).toBe(404);
            expect((await Order.findById(order._id))?.status).toBe("Preparing");
        });

        it("refuses a customer the right to edit a restaurant's about text", async () => {
            const res = await request(app)
                .post(`/api/restaurant/restaurants/${restaurant._id}/about`)
                .set("Cookie", `token=${customerToken}`)
                .send({ info: "hacked" });
            expect(res.status).toBe(403);
        });

        it("refuses one restaurant the right to edit another's about text", async () => {
            const res = await request(app)
                .post(`/api/restaurant/restaurants/${restaurant._id}/about`)
                .set("Cookie", `token=${otherOwnerToken}`)
                .send({ info: "hacked" });
            expect(res.status).toBe(403);
        });

        it("lets the owning restaurant edit its own about text", async () => {
            const res = await request(app)
                .post(`/api/restaurant/restaurants/${restaurant._id}/about`)
                .set("Cookie", `token=${ownerToken}`)
                .send({ info: "We are open." });
            expect(res.status).toBe(201);
        });

        it("refuses one restaurant the right to delete another's dish", async () => {
            const res = await request(app)
                .delete(`/api/restaurant/dishes/${dish._id}`)
                .set("Cookie", `token=${otherOwnerToken}`);
            expect(res.status).toBe(403);
            expect(await Dish.findById(dish._id)).not.toBeNull();
        });

        // toggleToPreparing, getOrdersCreated, getLastSevenOrders and getNumbers
        // previously trusted whatever restaurant id was in the URL/query once
        // *some* restaurant middleware had passed — never that it was the
        // caller's own restaurant. A rival could read another restaurant's
        // incoming orders, recent orders and revenue, or (on toggleToPreparing)
        // mutate its orders outright.
        it("refuses one restaurant the incoming-orders queue of another", async () => {
            const res = await request(app)
                .get(`/api/order/orders/${restaurant._id}/created`)
                .set("Cookie", `token=${otherOwnerToken}`);
            expect(res.status).toBe(403);
        });

        it("lets the owning restaurant query its own incoming-orders queue", async () => {
            const res = await request(app)
                .get(`/api/order/orders/${restaurant._id}/created`)
                .set("Cookie", `token=${ownerToken}`);
            expect(res.status).not.toBe(403);
        });

        it("refuses one restaurant another's recent-orders list", async () => {
            const res = await request(app)
                .get(`/api/order/restaurants/${restaurant._id}/orders/recent`)
                .set("Cookie", `token=${otherOwnerToken}`);
            expect(res.status).toBe(403);
        });

        it("lets the owning restaurant read its own recent orders", async () => {
            const res = await request(app)
                .get(`/api/order/restaurants/${restaurant._id}/orders/recent`)
                .set("Cookie", `token=${ownerToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
        });

        it("refuses one restaurant another's revenue statistics", async () => {
            const res = await request(app)
                .get(`/api/order/orders/statistics?id=${restaurant._id}`)
                .set("Cookie", `token=${otherOwnerToken}`);
            expect(res.status).toBe(403);
        });

        it("lets the owning restaurant read its own revenue statistics", async () => {
            const res = await request(app)
                .get(`/api/order/orders/statistics?id=${restaurant._id}`)
                .set("Cookie", `token=${ownerToken}`);
            expect(res.status).toBe(200);
        });

        it("refuses a restaurant account platform-wide statistics (no id) — admin only", async () => {
            const res = await request(app)
                .get(`/api/order/orders/statistics`)
                .set("Cookie", `token=${ownerToken}`);
            expect(res.status).toBe(403);
        });

        it("refuses one restaurant the right to toggle another's order to Preparing", async () => {
            await Order.updateOne({ _id: order._id }, { $set: { status: "Created" } });
            const res = await request(app)
                .patch(`/api/order/orders/${order._id}/status`)
                .set("Cookie", `token=${otherOwnerToken}`);
            expect(res.status).toBe(404);
            expect((await Order.findById(order._id))?.status).toBe("Created");
        });

        it("lets the owning restaurant toggle its own order to Preparing", async () => {
            await Order.updateOne({ _id: order._id }, { $set: { status: "Created" } });
            const res = await request(app)
                .patch(`/api/order/orders/${order._id}/status`)
                .set("Cookie", `token=${ownerToken}`);
            expect(res.status).toBe(200);
            expect((await Order.findById(order._id))?.status).toBe("Preparing");
        });
    });

    describe("customer surfaces", () => {
        it("refuses one customer sight of another's order", async () => {
            const res = await request(app)
                .get(`/api/order/orders/${order._id}`)
                .set("Cookie", `token=${otherCustomerToken}`);
            expect(res.status).toBe(404);
        });

        it("refuses one customer the right to cancel another's order", async () => {
            const res = await request(app)
                .patch(`/api/order/orders/${order._id}/cancel`)
                .set("Cookie", `token=${otherCustomerToken}`)
                .send({});
            expect(res.status).toBe(404);
            expect((await Order.findById(order._id))?.status).toBe("Preparing");
        });

        it("lets a customer read their own order", async () => {
            const res = await request(app)
                .get(`/api/order/orders/${order._id}`)
                .set("Cookie", `token=${customerToken}`);
            expect(res.status).toBe(200);
        });
    });

    describe("token handling", () => {
        it("rejects a forged token", async () => {
            const forged = jwt.sign({ userId: customer._id, role: "admin" }, "not-the-real-secret");
            const res = await request(app).get("/api/order/orders/statistics").set("Cookie", `token=${forged}`);
            expect(res.status).toBe(401);
        });

        it("rejects an expired token", async () => {
            const expired = jwt.sign({ userId: admin._id, role: "admin" }, process.env.JWT_SECRET!, { expiresIn: "-1s" });
            const res = await request(app).get("/api/order/orders/statistics").set("Cookie", `token=${expired}`);
            expect(res.status).toBe(401);
        });

        it("ignores a role claim that contradicts the stored account", async () => {
            // The token says admin; the user record says customer. Middleware
            // that trusted the claim alone would grant access here.
            const lying = jwt.sign({ userId: customer._id, role: "admin" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
            const res = await request(app).get("/api/order/orders/statistics").set("Cookie", `token=${lying}`);
            expect(res.status).toBe(403);
        });
    });
});
