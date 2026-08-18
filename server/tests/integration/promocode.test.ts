import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../../app";
import User, { IUserDocument } from "../../models/User";
import Promocode from "../../models/Promocode";

let mongo: MongoMemoryServer;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

describe("promocode api", () => {
    let user: IUserDocument;
    let userToken: string;
    let admin: IUserDocument;
    let adminToken: string;

    beforeEach(async () => {
        user = await User.create({ username: "promouser", password: "x" });
        userToken = jwt.sign({ userId: user._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
        admin = await User.create({ username: "promoadmin", password: "x", role: "admin" });
        adminToken = jwt.sign({ userId: admin._id, role: "admin" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Promocode.deleteMany({});
    });

    describe("create promocode (admin)", () => {
        it("creates a valid Usual promocode", async () => {
            const res = await request(app).post("/api/promocode/promocodes")
                .set("Cookie", `token=${adminToken}`)
                .send({ data: { code: "WEEKEND10", percent: 10, type: "Usual" } });

            expect(res.status).toBe(200);
            const saved = await Promocode.findOne({ code: "WEEKEND10" });
            expect(saved?.discountPercent).toBe(10);
            expect(saved?.type).toBe("Usual");
        });

        it("403s a non-admin caller", async () => {
            const res = await request(app).post("/api/promocode/promocodes")
                .set("Cookie", `token=${userToken}`)
                .send({ data: { code: "NOPE", percent: 10, type: "Usual" } });
            expect(res.status).toBe(403);
        });

        it("rejects a percent above 100, even called directly (bypassing the dashboard form's own bound)", async () => {
            const res = await request(app).post("/api/promocode/promocodes")
                .set("Cookie", `token=${adminToken}`)
                .send({ data: { code: "TOOMUCH", percent: 500, type: "Usual" } });

            expect(res.status).toBe(400);
            expect(await Promocode.findOne({ code: "TOOMUCH" })).toBeNull();
        });

        it("rejects a non-positive percent", async () => {
            const res = await request(app).post("/api/promocode/promocodes")
                .set("Cookie", `token=${adminToken}`)
                .send({ data: { code: "NEGATIVE", percent: -10, type: "Special" } });

            expect(res.status).toBe(400);
        });

        it("rejects an invalid type", async () => {
            const res = await request(app).post("/api/promocode/promocodes")
                .set("Cookie", `token=${adminToken}`)
                .send({ data: { code: "BADTYPE", percent: 10, type: "Bogus" } });

            expect(res.status).toBe(400);
        });

        it("409s a duplicate code instead of a raw 500", async () => {
            await Promocode.create({ code: "DUPE", discountPercent: 10, type: "Usual" });
            const res = await request(app).post("/api/promocode/promocodes")
                .set("Cookie", `token=${adminToken}`)
                .send({ data: { code: "DUPE", percent: 20, type: "Special", isUsed: false } });

            expect(res.status).toBe(409);
        });
    });

    describe("get promocode (claim a Usual code)", () => {
        it("assigns a Usual promocode to the user", async () => {
            await Promocode.create({ code: "WEEKEND10", discountPercent: 10, type: "Usual" });
            const res = await request(app).post("/api/promocode/promocodes/WEEKEND10")
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(200);
            const saved = await User.findById(user._id);
            expect(saved?.usualPromocode).not.toBeNull();
        });

        it("400s if the user already holds a Usual promocode", async () => {
            const promo = await Promocode.create({ code: "WEEKEND10", discountPercent: 10, type: "Usual" });
            user.usualPromocode = promo._id;
            await user.save();

            const res = await request(app).post("/api/promocode/promocodes/WEEKEND10")
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(400);
        });

        it("404s an unknown code", async () => {
            const res = await request(app).post("/api/promocode/promocodes/NOPE")
                .set("Cookie", `token=${userToken}`);
            expect(res.status).toBe(404);
        });

        it("401s with no auth", async () => {
            const res = await request(app).post("/api/promocode/promocodes/WEEKEND10");
            expect(res.status).toBe(401);
        });
    });

    describe("use promocode (redeem a Special one-time code)", () => {
        it("redeems an unused Special code and returns its discount", async () => {
            await Promocode.create({ code: "FEAST20", discountPercent: 20, type: "Special", isUsed: false });
            const res = await request(app).post("/api/promocode/promocodes/FEAST20/use")
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ discount: 20 });
            const saved = await User.findById(user._id);
            expect(saved?.promocodes?.length).toBe(1);
        });

        it("rejects reusing an already-used Special code", async () => {
            await Promocode.create({ code: "FEAST20", discountPercent: 20, type: "Special", isUsed: true });
            const res = await request(app).post("/api/promocode/promocodes/FEAST20/use")
                .set("Cookie", `token=${userToken}`);

            expect(res.status).toBe(400);
        });

        it("404s an unknown code", async () => {
            const res = await request(app).post("/api/promocode/promocodes/NOPE/use")
                .set("Cookie", `token=${userToken}`);
            expect(res.status).toBe(404);
        });
    });
});
