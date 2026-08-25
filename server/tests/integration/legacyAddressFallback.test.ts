import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../../app";
import Restaurant, { Category } from "../../models/Restaurant";
import Order from "../../models/Order";
import User from "../../models/User";

let mongo: MongoMemoryServer;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

const LEGACY_ADDRESS = { city: "Lviv", street: "Horodotska", houseNumber: "12" };

/**
 * Regression coverage for a real production incident: the adress -> address
 * rename shipped in the schema, but the deployed database was never migrated
 * (server/scripts/migrate-address-field.ts is a manual, one-off script — it
 * does not run itself). Every existing document still had `adress`, and the
 * client reads `restaurant.address.street` unconditionally, which crashed the
 * whole page with an uncaught TypeError in production.
 *
 * These tests insert documents through the driver, not the model, bypassing
 * schema validation entirely — that is the only way to reproduce a document
 * shaped exactly like the real pre-migration production data.
 */
describe("legacy adress -> address fallback", () => {
    beforeEach(async () => {
        await Promise.all([
            Restaurant.deleteMany({}), Order.deleteMany({}), User.deleteMany({}),
        ]);
    });

    describe("Restaurant", () => {
        it("exposes address from adress on a pre-migration document", async () => {
            const inserted = await mongoose.connection.db!.collection("restaurants").insertOne({
                title: "Burger city", description: "City of burgers",
                adress: LEGACY_ADDRESS,
                phone: "+380000", websiteUrl: "s.com", imageUrl: "img.jpg",
                categories: [Category.FastFood], rating: 3,
                startDay: "Monday", endDay: "Friday", startHour: "9:00", endHour: "14:00",
                dishes: [], reviews: [],
            });

            const res = await request(app).get(`/api/restaurant/restaurants/${inserted.insertedId}`);

            expect(res.status).toBe(200);
            expect(res.body.address).toEqual(LEGACY_ADDRESS);
            // adress is not part of the public shape and should not leak through.
            expect(res.body.adress).toBeUndefined();
        });

        it("prefers a real address over a leftover adress if a document somehow has both", async () => {
            const newer = { city: "Kyiv", street: "Khreschatyk", houseNumber: "1" };
            const inserted = await mongoose.connection.db!.collection("restaurants").insertOne({
                title: "Both Fields", description: "d",
                address: newer, adress: LEGACY_ADDRESS,
                phone: "+380000", websiteUrl: "s.com", imageUrl: "img.jpg",
                categories: [Category.FastFood], rating: 3,
                startDay: "Monday", endDay: "Friday", startHour: "9:00", endHour: "14:00",
                dishes: [], reviews: [],
            });

            const res = await request(app).get(`/api/restaurant/restaurants/${inserted.insertedId}`);

            expect(res.body.address).toEqual(newer);
        });

        it("does not affect an already-migrated document", async () => {
            const restaurant = await Restaurant.create({
                title: "Already Fine", description: "d",
                address: { city: "Kyiv", street: "Main", houseNumber: 1 },
                phone: "+380000", websiteUrl: "s.com", imageUrl: "img.jpg",
                categories: [Category.FastFood], rating: 3,
                startDay: "Monday", endDay: "Friday", startHour: "9:00", endHour: "14:00",
            });

            const res = await request(app).get(`/api/restaurant/restaurants/${restaurant._id}`);

            // houseNumber round-trips as a string here — Restaurant.address.houseNumber
            // is typed `String` in the actual schema (pre-existing, unrelated to this
            // fallback), unlike Order.address.houseNumber which is a real Number.
            expect(res.body.address).toEqual({ city: "Kyiv", street: "Main", houseNumber: "1" });
        });

        it("falls back on the category-filtered listing endpoint (an array response)", async () => {
            await mongoose.connection.db!.collection("restaurants").insertOne({
                title: "Burger city", description: "City of burgers",
                adress: LEGACY_ADDRESS,
                phone: "+380000", websiteUrl: "s.com", imageUrl: "img.jpg",
                categories: [Category.FastFood], rating: 3,
                startDay: "Monday", endDay: "Friday", startHour: "9:00", endHour: "14:00",
                dishes: [], reviews: [],
            });

            const res = await request(app)
                .get("/api/restaurant/restaurants/filter")
                .query({ categorie: Category.FastFood });

            expect(res.status).toBe(200);
            expect(res.body[0].address).toEqual(LEGACY_ADDRESS);
        });

        it("falls back on the dedicated get-address-by-title endpoint, whose query only selects address/location", async () => {
            await mongoose.connection.db!.collection("restaurants").insertOne({
                title: "Burger city", description: "City of burgers",
                adress: LEGACY_ADDRESS,
                phone: "+380000", websiteUrl: "s.com", imageUrl: "img.jpg",
                categories: [Category.FastFood], rating: 3,
                startDay: "Monday", endDay: "Friday", startHour: "9:00", endHour: "14:00",
                dishes: [], reviews: [],
            });

            const res = await request(app).get(`/api/restaurant/restaurants/${encodeURIComponent("Burger city")}/address`);

            expect(res.status).toBe(200);
            expect(res.body.address).toEqual(LEGACY_ADDRESS);
        });
    });

    describe("Order", () => {
        it("exposes address from adress on a pre-migration order", async () => {
            const user = await User.create({ username: "legacyUser", password: "x" });
            const inserted = await mongoose.connection.db!.collection("orders").insertOne({
                userId: user._id,
                restaurantTitle: "Burger city", restaurantImage: "img.jpg",
                approxTime: 30, totalPrice: 20, items: [], status: "Created",
                adress: { city: "Lviv", countryOrRegion: "Ukraine", street: "Horodotska", houseNumber: 12 },
            });

            const token = jwt.sign({ userId: user._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
            const res = await request(app)
                .get(`/api/order/orders/${inserted.insertedId}`)
                .set("Cookie", `token=${token}`);

            expect(res.status).toBe(200);
            expect(res.body.address).toEqual({ city: "Lviv", countryOrRegion: "Ukraine", street: "Horodotska", houseNumber: 12 });
        });
    });
});
