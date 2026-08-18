import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "../../app";
import User, { IUserDocument } from "../../models/User";
import Courier from "../../models/Courier";

let mongo: MongoMemoryServer;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

describe("courier application flow", () => {
    let user: IUserDocument;
    let userToken: string;
    let admin: IUserDocument;
    let adminToken: string;

    const applicationData = {
        name: "Jane", surname: "Doe", phoneNumber: "+380123456789", email: "jane@example.com",
        transport: "Bike", city: "Kyiv", age: 25,
    };

    beforeEach(async () => {
        user = await User.create({ username: "applicant", password: "x" });
        userToken = jwt.sign({ userId: user._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
        admin = await User.create({ username: "courierAdmin", password: "x", role: "admin" });
        adminToken = jwt.sign({ userId: admin._id, role: "admin" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Courier.deleteMany({});
    });

    describe("create application", () => {
        it("creates a Processing application for the caller", async () => {
            const res = await request(app).post("/api/courier/applications")
                .set("Cookie", `token=${userToken}`)
                .send({ data: applicationData });

            expect(res.status).toBe(200);
            const saved = await Courier.findOne({ userId: user._id });
            expect(saved?.status).toBe("Processing");
        });

        it("401s with no auth", async () => {
            const res = await request(app).post("/api/courier/applications").send({ data: applicationData });
            expect(res.status).toBe(401);
        });

        it("409s a duplicate application from the same user (no unique constraint backs this — the check is what stops it)", async () => {
            await Courier.create({
                fullname: "Existing App", phoneNumber: "+380000000000", email: "existing@example.com",
                transport: "Car", userId: user._id, city: "Lviv", age: 30, status: "Processing",
            });

            const res = await request(app).post("/api/courier/applications")
                .set("Cookie", `token=${userToken}`)
                .send({ data: applicationData });

            expect(res.status).toBe(409);
            expect(await Courier.countDocuments({ userId: user._id })).toBe(1);
        });
    });

    describe("check if sent application", () => {
        it("false for a user with no application", async () => {
            const res = await request(app).get("/api/courier/applications/status")
                .set("Cookie", `token=${userToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ status: false });
        });

        it("true once the user has applied", async () => {
            await Courier.create({
                fullname: "Jane Doe", phoneNumber: "+380123456789", email: "jane@example.com",
                transport: "Bike", userId: user._id, city: "Kyiv", age: 25, status: "Processing",
            });
            const res = await request(app).get("/api/courier/applications/status")
                .set("Cookie", `token=${userToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ status: true });
        });
    });

    describe("list applications (admin)", () => {
        it("403s a non-admin", async () => {
            const res = await request(app).get("/api/courier/applications")
                .set("Cookie", `token=${userToken}`);
            expect(res.status).toBe(403);
        });

        it("lists Processing applications for an admin", async () => {
            await Courier.create({
                fullname: "Jane Doe", phoneNumber: "+380123456789", email: "jane@example.com",
                transport: "Bike", userId: user._id, city: "Kyiv", age: 25, status: "Processing",
            });
            const res = await request(app).get("/api/courier/applications")
                .set("Cookie", `token=${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(1);
        });
    });

    describe("accept/decline application (admin)", () => {
        it("accepting grants the courier role and marks the application Working", async () => {
            const application = await Courier.create({
                fullname: "Jane Doe", phoneNumber: "+380123456789", email: "jane@example.com",
                transport: "Bike", userId: user._id, city: "Kyiv", age: 25, status: "Processing",
            });

            const res = await request(app).post(`/api/courier/applications/${application._id}`)
                .set("Cookie", `token=${adminToken}`)
                .send({ status: "accepted" });

            expect(res.status).toBe(200);
            const savedUser = await User.findById(user._id);
            expect(savedUser?.role).toBe("courier");
            const savedApp = await Courier.findById(application._id);
            expect(savedApp?.status).toBe("Working");
        });

        it("declining deletes the application and leaves the user's role untouched", async () => {
            const application = await Courier.create({
                fullname: "Jane Doe", phoneNumber: "+380123456789", email: "jane@example.com",
                transport: "Bike", userId: user._id, city: "Kyiv", age: 25, status: "Processing",
            });

            const res = await request(app).post(`/api/courier/applications/${application._id}`)
                .set("Cookie", `token=${adminToken}`)
                .send({ status: "declined" });

            expect(res.status).toBe(200);
            expect(await Courier.findById(application._id)).toBeNull();
            const savedUser = await User.findById(user._id);
            expect(savedUser?.role).toBe("user");
        });

        it("403s a non-admin trying to accept/decline", async () => {
            const application = await Courier.create({
                fullname: "Jane Doe", phoneNumber: "+380123456789", email: "jane@example.com",
                transport: "Bike", userId: user._id, city: "Kyiv", age: 25, status: "Processing",
            });
            const res = await request(app).post(`/api/courier/applications/${application._id}`)
                .set("Cookie", `token=${userToken}`)
                .send({ status: "accepted" });
            expect(res.status).toBe(403);
        });
    });
});
