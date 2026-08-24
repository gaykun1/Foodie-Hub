import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../../app";
import Restaurant, { Category, IRestaurantDocument } from "../../models/Restaurant";
import Dish, { IDishDocument } from "../../models/Dish";
import Review from "../../models/Review";
import User, { IUserDocument } from "../../models/User";

let mongo: MongoMemoryServer;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

/**
 * The public demo depends on a logged-out visitor being able to browse the
 * catalogue end to end. These tests send no auth cookie at all and assert both
 * halves of the contract: discovery is open, and everything tied to an account
 * still refuses anonymous callers.
 */
describe("guest browsing", () => {
    let restaurant: IRestaurantDocument;
    let dish: IDishDocument;
    let author: IUserDocument;

    beforeEach(async () => {
        await Promise.all([
            Restaurant.deleteMany({}),
            Dish.deleteMany({}),
            Review.deleteMany({}),
            User.deleteMany({}),
        ]);

        restaurant = await Restaurant.create({
            title: "Guest Grill", dishes: [], description: "Open to everyone", imageUrl: "img.jpg",
            categories: [Category.FastFood], address: { street: "Main", city: "Kyiv", houseNumber: 1 },
            location: { lat: 50.45, lng: 30.52 },
            startDay: "Monday", endDay: "Sunday", startHour: "10:00", endHour: "22:00",
            websiteUrl: "site.com", phone: "+380000000",
        });

        dish = await Dish.create({
            title: "Guest Burger", description: "Tasty", imageUrl: "img.jpg", price: 12,
            restaurantId: restaurant._id, typeOfFood: "Main Courses", sold: 3,
        });
        restaurant.dishes.push(dish._id);
        await restaurant.save();

        author = await User.create({ username: "reviewer", password: "x" });
        const review = await Review.create({ sender: author._id, text: "Great", rating: 5, restaurantId: restaurant._id });
        restaurant.reviews.push(review._id);
        await restaurant.save();
    });

    describe("public catalogue", () => {
        it("lists restaurants by category without a session", async () => {
            const res = await request(app)
                .get("/api/restaurant/restaurants/filter")
                .query({ categorie: Category.FastFood });

            expect(res.status).toBe(200);
            expect(res.body[0].title).toBe("Guest Grill");
        });

        it("returns every restaurant for the All category", async () => {
            const res = await request(app)
                .get("/api/restaurant/restaurants/filter")
                .query({ categorie: Category.All });

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
        });

        it("searches restaurants without a session", async () => {
            const res = await request(app)
                .get("/api/restaurant/restaurants/search")
                .query({ chars: "guest" });

            expect(res.status).toBe(200);
            expect(res.body[0].title).toBe("Guest Grill");
        });

        it("opens a restaurant page without a session", async () => {
            const res = await request(app).get(`/api/restaurant/restaurants/${restaurant._id}`);

            expect(res.status).toBe(200);
            expect(res.body.title).toBe("Guest Grill");
        });

        it("reads a restaurant's menu without a session", async () => {
            const res = await request(app).get(`/api/restaurant/dishes/${restaurant._id}`);

            expect(res.status).toBe(200);
            expect(res.body.dishes).toHaveLength(1);
            expect(res.body.dishes[0].title).toBe("Guest Burger");
        });

        it("returns the restaurant's own identity alongside its menu", async () => {
            const res = await request(app).get(`/api/restaurant/dishes/${restaurant._id}`);

            // A guest basket lives in localStorage and has no server-side cart
            // to resolve the restaurant from, so the menu response has to carry
            // enough to identify it. A bare `.select("dishes")` did not.
            expect(res.body.title).toBe("Guest Grill");
            expect(res.body.imageUrl).toBe("img.jpg");
        });

        it("reads a restaurant's reviews without a session", async () => {
            const res = await request(app).get(`/api/restaurant/restaurants/${restaurant._id}/reviews`);

            expect(res.status).toBe(200);
        });

        it("reads a restaurant's about text without a session", async () => {
            await Restaurant.findByIdAndUpdate(restaurant._id, { about: "We opened in 2016." });

            const res = await request(app).get(`/api/restaurant/restaurants/${restaurant._id}/about`);

            expect(res.status).toBe(200);
            expect(res.body).toBe("We opened in 2016.");
        });

        it("serves trending dishes to a visitor who has no saved city", async () => {
            // Without a city this used to match nothing, leaving the home page's
            // trending section permanently empty for logged-out visitors.
            const res = await request(app).get("/api/restaurant/dishes/nearby");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
            expect(res.body[0].title).toBe("Guest Burger");
        });

        it("attaches the owning restaurant to each trending dish so it can be added to a cart", async () => {
            const res = await request(app).get("/api/restaurant/dishes/nearby");

            expect(res.body[0].restaurant).toMatchObject({
                _id: restaurant._id.toString(),
                title: "Guest Grill",
            });
        });
    });

    describe("account-only actions still refuse anonymous callers", () => {
        it.each([
            ["view the cart", "get", "/api/cart/"],
            ["view orders", "get", "/api/order/orders"],
            ["view saved addresses", "get", "/api/address/addresses"],
            ["view favourites", "get", "/api/restaurant/restaurants/favourites"],
            ["read their profile", "get", "/api/auth/profile"],
        ])("refuses to let a guest %s", async (_label, method, path) => {
            const res = await (request(app) as unknown as Record<string, (p: string) => request.Test>)[method](path);
            expect(res.status).toBe(401);
        });

        it("refuses to let a guest place an order", async () => {
            const res = await request(app).post("/api/order/orders").send({ cart: {} });
            expect(res.status).toBe(401);
        });

        it("refuses to let a guest favourite a restaurant", async () => {
            const res = await request(app).post(`/api/restaurant/restaurants/${restaurant._id}/favourite`).send({});
            expect(res.status).toBe(401);
        });

        it("refuses to let a guest post a review", async () => {
            const res = await request(app)
                .post("/api/restaurant/reviews")
                .send({ id: restaurant._id, text: "Sneaky", rating: 1 });
            expect(res.status).toBe(401);
        });

        it("refuses to let a guest apply for courier work", async () => {
            const res = await request(app).post("/api/courier/applications").send({ data: {} });
            expect(res.status).toBe(401);
        });

        it("refuses to let a guest start a payment", async () => {
            const res = await request(app)
                .post("/api/payment/payment-intent")
                .send({ shipping: 2.2, percent: 0 });
            expect(res.status).toBe(401);
        });
    });
});
