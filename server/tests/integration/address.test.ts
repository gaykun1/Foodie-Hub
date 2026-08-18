import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../../app";
import User, { IUserDocument } from "../../models/User";
import Address from "../../models/Address";

let mongo: MongoMemoryServer;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

describe("saved addresses", () => {
    let user: IUserDocument;
    let userToken: string;

    const validAddress = { street: "Shevchenko", houseNumber: 3, city: "Kyiv", countryOrRegion: "Ukraine" };

    beforeEach(async () => {
        user = await User.create({ username: "addressUser", password: "x" });
        userToken = jwt.sign({ userId: user._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Address.deleteMany({});
    });

    describe("create", () => {
        it("creates an address for the caller", async () => {
            const res = await request(app).post("/api/address/addresses")
                .set("Cookie", `token=${userToken}`)
                .send({ ...validAddress, label: "Home" });

            expect(res.status).toBe(201);
            expect(res.body.label).toBe("Home");
            expect(res.body.userId).toBe(user._id.toString());
        });

        it("400s a payload missing a required field", async () => {
            const res = await request(app).post("/api/address/addresses")
                .set("Cookie", `token=${userToken}`)
                .send({ street: "Shevchenko" });

            expect(res.status).toBe(400);
        });

        it("unsets any previous default when a new one is marked default", async () => {
            const first = await Address.create({ userId: user._id, ...validAddress, isDefault: true });

            const res = await request(app).post("/api/address/addresses")
                .set("Cookie", `token=${userToken}`)
                .send({ ...validAddress, city: "Lviv", isDefault: true });

            expect(res.status).toBe(201);
            const savedFirst = await Address.findById(first._id);
            expect(savedFirst?.isDefault).toBe(false);
            expect(res.body.isDefault).toBe(true);
        });

        it("401s with no auth token", async () => {
            const res = await request(app).post("/api/address/addresses").send(validAddress);
            expect(res.status).toBe(401);
        });
    });

    describe("get", () => {
        it("returns only the caller's own addresses, default first", async () => {
            const otherUser = await User.create({ username: "notAddressOwner", password: "x" });
            await Address.create({ userId: otherUser._id, ...validAddress });
            await Address.create({ userId: user._id, ...validAddress, city: "Lviv" });
            await Address.create({ userId: user._id, ...validAddress, city: "Odesa", isDefault: true });

            const res = await request(app).get("/api/address/addresses")
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body[0].isDefault).toBe(true);
        });

        it("401s with no auth token", async () => {
            const res = await request(app).get("/api/address/addresses");
            expect(res.status).toBe(401);
        });
    });

    describe("update", () => {
        it("updates a field on the caller's own address", async () => {
            const address = await Address.create({ userId: user._id, ...validAddress });

            const res = await request(app).patch(`/api/address/addresses/${address._id}`)
                .set("Cookie", `token=${userToken}`)
                .send({ city: "Odesa" });

            expect(res.status).toBe(200);
            expect(res.body.city).toBe("Odesa");
        });

        it("404s another user's address", async () => {
            const otherUser = await User.create({ username: "notAddressOwner2", password: "x" });
            const address = await Address.create({ userId: otherUser._id, ...validAddress });

            const res = await request(app).patch(`/api/address/addresses/${address._id}`)
                .set("Cookie", `token=${userToken}`)
                .send({ city: "Odesa" });

            expect(res.status).toBe(404);
        });
    });

    describe("delete", () => {
        it("removes the caller's own address", async () => {
            const address = await Address.create({ userId: user._id, ...validAddress });

            const res = await request(app).delete(`/api/address/addresses/${address._id}`)
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(200);
            expect(await Address.findById(address._id)).toBeNull();
        });

        it("404s another user's address", async () => {
            const otherUser = await User.create({ username: "notAddressOwner3", password: "x" });
            const address = await Address.create({ userId: otherUser._id, ...validAddress });

            const res = await request(app).delete(`/api/address/addresses/${address._id}`)
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(404);
            expect(await Address.findById(address._id)).not.toBeNull();
        });
    });
});
