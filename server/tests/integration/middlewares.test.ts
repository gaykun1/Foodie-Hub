import jwt from "jsonwebtoken";
import User, { IUserDocument } from "../../models/User"
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest"
import { app } from "../../app";
let mongo: MongoMemoryServer;
beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    mongoose.connect(uri);
})

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

// using protected route for testing middlewares
describe("middlewares for backend", () => {
    let user: IUserDocument;
    let validToken: string;
    beforeAll(async () => {
        user = await User.create({ username: "testuser5", password: "12345678Aa" });
        validToken = await jwt.sign({ userId: user._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });

    })
    afterAll(async () => {
        await User.deleteMany({});
    })
    describe("auth middleware", () => {
        it("Protected", async () => {
            const res =await request(app).get("/api/protected")
                .set("Cookie", `token=${validToken}`)
                .set("Authorization",`Bearer ${validToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toBe("Route is protected");
        })
          it("401 not authorized", async () => {
            const res =await request(app).get("/api/protected");

            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Unauthorized (no token)");
        })
          it("401 invalid token", async () => {
            const res =await request(app).get("/api/protected")
                .set("Cookie", `token=${new mongoose.Types.ObjectId}`)
                .set("Authorization",`Bearer ${new mongoose.Types.ObjectId}`);

            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Invalid token");
        })
    })
})