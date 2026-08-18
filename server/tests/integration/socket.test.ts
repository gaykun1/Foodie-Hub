import dotenv from "dotenv";
dotenv.config();
import http from "http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import { initSocket, io as serverIo } from "../../socket";
import User, { IUserDocument } from "../../models/User";
import Order from "../../models/Order";

let mongo: MongoMemoryServer;
let httpServer: http.Server;
let baseUrl: string;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const connectClient = (token?: string): Promise<ClientSocket> => {
    return new Promise((resolve, reject) => {
        const socket = ioClient(baseUrl, {
            transports: ["websocket"],
            extraHeaders: token ? { Cookie: `token=${token}` } : undefined,
            reconnection: false,
        });
        socket.on("connect", () => resolve(socket));
        socket.on("connect_error", (err) => reject(err));
    });
};

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());

    httpServer = http.createServer();
    initSocket(httpServer);
    await new Promise<void>(resolve => httpServer.listen(0, resolve));
    const address = httpServer.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://localhost:${port}`;
});

afterAll(async () => {
    serverIo.close();
    await new Promise<void>(resolve => httpServer.close(() => resolve()));
    await mongoose.connection.close();
    await mongo.stop();
});

describe("socket auth and room scoping", () => {
    let admin: IUserDocument;
    let adminToken: string;
    let owner: IUserDocument;
    let ownerToken: string;
    let intruder: IUserDocument;
    let intruderToken: string;
    let courier: IUserDocument;
    let courierToken: string;

    beforeEach(async () => {
        admin = await User.create({ username: "sockadmin", password: "x", role: "admin" });
        adminToken = jwt.sign({ userId: admin._id, role: "admin" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
        owner = await User.create({ username: "sockowner", password: "x" });
        ownerToken = jwt.sign({ userId: owner._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
        intruder = await User.create({ username: "sockintruder", password: "x" });
        intruderToken = jwt.sign({ userId: intruder._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
        courier = await User.create({ username: "sockcourier", password: "x", role: "courier" });
        courierToken = jwt.sign({ userId: courier._id, role: "courier" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Order.deleteMany({});
    });

    it("rejects a connection with no auth cookie", async () => {
        await expect(connectClient()).rejects.toBeDefined();
    });

    it("only lets an admin join the admin broadcast room", async () => {
        const adminSocket = await connectClient(adminToken);
        const userSocket = await connectClient(ownerToken);
        try {
            const adminReceived = new Promise(resolve => adminSocket.on("updateOrders", resolve));
            const userReceived = new Promise(resolve => userSocket.on("updateOrders", resolve));

            adminSocket.emit("joinDashboard");
            userSocket.emit("joinDashboard"); // non-admin — should be ignored
            await wait(200);

            serverIo.to(admin._id.toString()).emit("updateOrders", ["ok"]);

            await expect(adminReceived).resolves.toEqual(["ok"]);
            const raced = await Promise.race([userReceived, wait(200).then(() => "timeout")]);
            expect(raced).toBe("timeout");
        } finally {
            adminSocket.disconnect();
            userSocket.disconnect();
        }
    });

    it("only lets the order's owner or assigned courier join its tracking room", async () => {
        const order = await Order.create({
            userId: owner._id,
            courierId: courier._id,
            items: [{ title: "Burger", imageUrl: "img.jpg", price: 10, amount: 1 }],
            restaurantTitle: "Best Burger",
            restaurantImage: "img.jpg",
            approxTime: 15,
            totalPrice: 10,
            status: "Delivering",
        });

        const ownerSocket = await connectClient(ownerToken);
        const intruderSocket = await connectClient(intruderToken);
        try {
            const ownerReceived = new Promise(resolve => ownerSocket.on("locationUpdate", resolve));
            const intruderReceived = new Promise(resolve => intruderSocket.on("locationUpdate", resolve));

            ownerSocket.emit("joinOrder", { orderId: order._id.toString() });
            intruderSocket.emit("joinOrder", { orderId: order._id.toString() }); // not this order's user/courier
            await wait(200);

            serverIo.to(order._id.toString()).emit("locationUpdate", { lat: 1, lng: 2 });

            await expect(ownerReceived).resolves.toEqual({ lat: 1, lng: 2 });
            const raced = await Promise.race([intruderReceived, wait(200).then(() => "timeout")]);
            expect(raced).toBe("timeout");
        } finally {
            ownerSocket.disconnect();
            intruderSocket.disconnect();
        }
    });

    it("only accepts updateLocation from the order's actually-assigned courier", async () => {
        const order = await Order.create({
            userId: owner._id,
            courierId: courier._id,
            items: [{ title: "Burger", imageUrl: "img.jpg", price: 10, amount: 1 }],
            restaurantTitle: "Best Burger",
            restaurantImage: "img.jpg",
            approxTime: 15,
            totalPrice: 10,
            status: "Delivering",
        });

        const ownerSocket = await connectClient(ownerToken);
        const intruderSocket = await connectClient(intruderToken);
        try {
            ownerSocket.emit("joinOrder", { orderId: order._id.toString() });
            await wait(150);

            const received = new Promise(resolve => ownerSocket.on("locationUpdate", resolve));
            intruderSocket.emit("updateLocation", { orderId: order._id.toString(), lat: 9, lng: 9 });

            const raced = await Promise.race([received, wait(200).then(() => "timeout")]);
            expect(raced).toBe("timeout");
        } finally {
            ownerSocket.disconnect();
            intruderSocket.disconnect();
        }
    });
});
