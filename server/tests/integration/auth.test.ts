import User from "../../models/User";
import request from "supertest"
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { app } from "../../app";
import mongoose from "mongoose";
import { MongoMemoryServer } from 'mongodb-memory-server';
let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});
describe("auth api", () => {

    describe("register", () => {
        it("Creates user", async () => {
             const res = await request(app).post("/api/auth/signup")
                .send({ username: "User", password: "12345678Aa" });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("user");
            expect(res.body.user).toHaveProperty("username", "User");
            expect(res.headers["set-cookie"]).toBeDefined();
        });
        it("Cannot create user", async () => {
            const res = await request(app).post("/api/auth/signup")
                .send({ username: "", password: "short" });
            expect(res.status).toBe(400);
        });
    })

    describe("login", () => {
        beforeAll(async () => {
            await User.create({ username: "testuser1", password: await bcrypt.hash("12345678Dd", 10) });
        })
        afterAll(async () => { 
            await User.deleteMany({});
            
        })

        it("Log in successfully", async () => {
            const res = await request(app).post("/api/auth/login")
                .send({ username: "testuser1", password: "12345678Dd" });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("user");
            expect(res.headers["set-cookie"]).toBeDefined();
        });
        it("User not found", async () => {
            const res = await request(app).post("/api/auth/login")
                .send({ username: "testU", password: "12345678Dd" });
            expect(res.status).toBe(404);
            expect(res.body).toBe("Not found");
        })
        it("Wrong password", async () => {
            const res = await request(app).post("/api/auth/login")
                .send({ username: "testuser1", password: "wrongpassword" });
            expect(res.status).toBe(401);
            expect(res.body).toBe("Wrong password!");
        });
        it("Server error!", async () => {
            jest.spyOn(User, 'findOne').mockImplementationOnce(() => {
                throw new Error("DB error");
            });
            const res = await request(app).post("/api/auth/login")
                .send({ username: "testuser1", password: "12345678Dd" });
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: "Server error" });
            jest.restoreAllMocks();
        });
    })

    describe("profile", () => {
        let validToken: string;
        beforeAll(async () => {
            const user = await User.create({ username: "testuser1", password: "12345678Aa" });
            validToken = await jwt.sign({ userId: user._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: '1h' });

        })

        afterAll(async () => {
            await User.deleteMany({});
        });

        it("get profile info", async () => {
            const res = await request(app).get("/api/auth/profile")
                .set("Cookie", `token=${validToken}`)
                .set("Authorization", `Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("user");
            expect(res.body.user.username).toBe("testuser1");
        })

        it("Not found user!", async () => {
            const fakeUserId = '507f1f77bcf86cd799439011';
            const invalidToken = jwt.sign(
                { userId: fakeUserId, role: 'user' },
                process.env.JWT_SECRET!,
                { expiresIn: '1h' }
            );
            const res = await request(app).get("/api/auth/profile")
                .set("Cookie", `token=${invalidToken}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('User not found!');
        })

        it("Server error!", async () => {
            jest.spyOn(User, 'findOne').mockImplementationOnce(() => {
                throw new Error("DB error");
            });
            const res = await request(app).get("/api/auth/profile")
                .send({ username: "testuser1", password: "12345678Dd" }).set("Cookie", `token=${validToken}`);
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ message: "Server error" });
            jest.restoreAllMocks();
        });
    })

    describe("update profile (password change)", () => {
        let user: any;
        let validToken: string;
        beforeEach(async () => {
            user = await User.create({ username: "passwordChangeUser", password: await bcrypt.hash("12345678Aa", 10) });
            validToken = await jwt.sign({ userId: user._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: '1h' });
        })
        afterEach(async () => {
            await User.deleteMany({});
        })

        it("rejects a new password that fails the strength policy, even called directly (bypassing client validation)", async () => {
            const res = await request(app).patch("/api/auth/profile")
                .set("Cookie", `token=${validToken}`)
                .send({ payload: { password: "12345678Aa", newPassword: "short", newPasswordAgain: "short" } });

            expect(res.status).toBe(400);
            const stored = await User.findById(user._id);
            expect(await bcrypt.compare("12345678Aa", stored!.password)).toBe(true);
        })

        it("accepts a new password meeting the policy", async () => {
            const res = await request(app).patch("/api/auth/profile")
                .set("Cookie", `token=${validToken}`)
                .send({ payload: { password: "12345678Aa", newPassword: "NewPassw0rd", newPasswordAgain: "NewPassw0rd" } });

            expect(res.status).toBe(200);
            const stored = await User.findById(user._id);
            expect(await bcrypt.compare("NewPassw0rd", stored!.password)).toBe(true);
        })

        it("rejects the wrong current password", async () => {
            const res = await request(app).patch("/api/auth/profile")
                .set("Cookie", `token=${validToken}`)
                .send({ payload: { password: "wrongCurrent1", newPassword: "NewPassw0rd", newPasswordAgain: "NewPassw0rd" } });

            expect(res.status).toBe(400);
            expect(res.body).toBe("Wrong password!");
        })

        it("rejects mismatched new-password confirmation", async () => {
            const res = await request(app).patch("/api/auth/profile")
                .set("Cookie", `token=${validToken}`)
                .send({ payload: { password: "12345678Aa", newPassword: "NewPassw0rd", newPasswordAgain: "Different0rd" } });

            expect(res.status).toBe(400);
            expect(res.body).toBe("Wrong password!");
        })
    })
})