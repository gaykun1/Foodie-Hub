import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// The simulator publishes through the socket layer, so that module is replaced
// with spies. Everything else — the models, the controller, the state machine —
// is the real thing.
const toEmit = jest.fn();
jest.mock("../../socket", () => ({
    io: { to: jest.fn(() => ({ emit: toEmit })) },
    socketsMap: new Map(),
    restaurantsSocketsMap: new Map(),
    activeAdmins: new Set(),
}));

import { app } from "../../app";
import User, { IUserDocument } from "../../models/User";
import Order, { IOrderDocument } from "../../models/Order";
import Restaurant, { Category, IRestaurantDocument } from "../../models/Restaurant";
import Courier from "../../models/Courier";
import { io } from "../../socket";
import {
    DEFAULT_TIMING,
    interpolate,
    isSimulating,
    resolveRoute,
    startSimulation,
    stopAllSimulations,
    stopSimulation,
} from "../../services/deliverySimulator";

let mongo: MongoMemoryServer;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    stopAllSimulations();
    await mongoose.connection.close();
    await mongo.stop();
});

const RESTAURANT_POINT = { lat: 50.4547, lng: 30.5169 };
const CUSTOMER_POINT = { lat: 50.4519, lng: 30.5116 };

/**
 * The delivery simulator is what makes the public demo watchable: without a
 * real kitchen or courier on the other end, a checked-out order would sit at
 * "Created" forever and the tracking map would never move.
 */
describe("delivery simulation", () => {
    let customer: IUserDocument;
    let customerToken: string;
    let otherCustomer: IUserDocument;
    let otherCustomerToken: string;
    let restaurant: IRestaurantDocument;
    let order: IOrderDocument;

    const createOrder = (overrides: Record<string, unknown> = {}) =>
        Order.create({
            userId: customer._id,
            items: [{ title: "Burger", imageUrl: "img.jpg", price: 10, amount: 1 }],
            restaurantTitle: restaurant.title,
            restaurantImage: restaurant.imageUrl,
            approxTime: 30,
            totalPrice: 12.2,
            shippingPrice: 2.2,
            status: "Created",
            address: { city: "Kyiv", countryOrRegion: "Ukraine", street: "Yaroslaviv Val", houseNumber: 15 },
            route: { restaurant: RESTAURANT_POINT, customer: CUSTOMER_POINT },
            ...overrides,
        });

    beforeEach(async () => {
        jest.clearAllMocks();
        stopAllSimulations();
        process.env.DEMO_SIMULATION = "true";

        await Promise.all([
            User.deleteMany({}), Order.deleteMany({}), Restaurant.deleteMany({}), Courier.deleteMany({}),
        ]);

        customer = await User.create({ username: "simCustomer", password: "x" });
        customerToken = jwt.sign({ userId: customer._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });
        otherCustomer = await User.create({ username: "simOther", password: "x" });
        otherCustomerToken = jwt.sign({ userId: otherCustomer._id, role: "user" }, process.env.JWT_SECRET!, { expiresIn: "1h" });

        restaurant = await Restaurant.create({
            title: "Sim Grill", dishes: [], description: "d", imageUrl: "img.jpg",
            categories: [Category.FastFood],
            address: { street: "Volodymyrska", city: "Kyiv", houseNumber: 20 },
            location: RESTAURANT_POINT,
            startDay: "Monday", endDay: "Sunday", startHour: "9:00", endHour: "23:00",
            websiteUrl: "s.com", phone: "+380000",
        });

        order = await createOrder();
    });

    afterEach(() => {
        stopAllSimulations();
        delete process.env.DEMO_SIMULATION;
    });

    describe("route interpolation", () => {
        it("starts at the restaurant", () => {
            expect(interpolate(RESTAURANT_POINT, CUSTOMER_POINT, 0)).toEqual(RESTAURANT_POINT);
        });

        it("ends at the customer", () => {
            expect(interpolate(RESTAURANT_POINT, CUSTOMER_POINT, 1)).toEqual(CUSTOMER_POINT);
        });

        it("sits exactly halfway at t=0.5", () => {
            const midpoint = interpolate(RESTAURANT_POINT, CUSTOMER_POINT, 0.5);
            expect(midpoint.lat).toBeCloseTo((RESTAURANT_POINT.lat + CUSTOMER_POINT.lat) / 2, 6);
            expect(midpoint.lng).toBeCloseTo((RESTAURANT_POINT.lng + CUSTOMER_POINT.lng) / 2, 6);
        });

        it("clamps out-of-range progress rather than overshooting the destination", () => {
            expect(interpolate(RESTAURANT_POINT, CUSTOMER_POINT, 2)).toEqual(CUSTOMER_POINT);
            expect(interpolate(RESTAURANT_POINT, CUSTOMER_POINT, -1)).toEqual(RESTAURANT_POINT);
        });

        it("moves monotonically towards the customer", () => {
            const distances = [0, 0.25, 0.5, 0.75, 1].map((t) => {
                const point = interpolate(RESTAURANT_POINT, CUSTOMER_POINT, t);
                return Math.hypot(point.lat - CUSTOMER_POINT.lat, point.lng - CUSTOMER_POINT.lng);
            });
            for (let i = 1; i < distances.length; i++) {
                expect(distances[i]).toBeLessThan(distances[i - 1]);
            }
        });
    });

    describe("resolveRoute", () => {
        it("uses the coordinates stored on the order, without geocoding", async () => {
            const route = await resolveRoute(order);

            // Compared field by field: these come back as Mongoose subdocuments,
            // not plain objects, so a structural equality check would compare
            // internal document machinery too.
            expect(route?.restaurant.lat).toBeCloseTo(RESTAURANT_POINT.lat, 6);
            expect(route?.restaurant.lng).toBeCloseTo(RESTAURANT_POINT.lng, 6);
            expect(route?.customer.lat).toBeCloseTo(CUSTOMER_POINT.lat, 6);
            expect(route?.customer.lng).toBeCloseTo(CUSTOMER_POINT.lng, 6);
        });

        it("falls back to the restaurant's stored location for a legacy order", async () => {
            const legacy = await createOrder({ route: { restaurant: null, customer: CUSTOMER_POINT } });

            const route = await resolveRoute(legacy);

            expect(route?.restaurant.lat).toBeCloseTo(RESTAURANT_POINT.lat, 6);
            expect(route?.restaurant.lng).toBeCloseTo(RESTAURANT_POINT.lng, 6);
        });
    });

    describe("starting a simulation", () => {
        it("assigns the demo courier and records the resolved route", async () => {
            const courier = await Courier.create({
                fullname: "Sim Courier", phoneNumber: "+380999", email: "sim@example.com",
                transport: "Bike", userId: customer._id, city: "Kyiv", age: 25, status: "Working",
            });

            const result = await startSimulation(order._id.toString(), DEFAULT_TIMING);

            expect(result).toEqual({ ok: true });
            const updated = await Order.findById(order._id);
            expect(updated?.isSimulated).toBe(true);
            expect(updated?.courierId?.toString()).toBe(courier._id.toString());
            expect(updated?.route?.restaurant?.lat).toBeCloseTo(RESTAURANT_POINT.lat, 4);
        });

        it("refuses an order that is not freshly placed", async () => {
            const delivered = await createOrder({ status: "Delivered" });

            const result = await startSimulation(delivered._id.toString(), DEFAULT_TIMING);

            expect(result).toEqual({ ok: false, reason: expect.stringContaining("Delivered") });
        });

        it("refuses an unknown order", async () => {
            const result = await startSimulation(new mongoose.Types.ObjectId().toString(), DEFAULT_TIMING);
            expect(result).toEqual({ ok: false, reason: "Order not found" });
        });

        it("refuses to run the same order twice at once", async () => {
            await startSimulation(order._id.toString(), DEFAULT_TIMING);

            const second = await startSimulation(order._id.toString(), DEFAULT_TIMING);

            expect(second).toEqual({ ok: false, reason: "Already simulating this order" });
        });

        it("tracks which orders are in flight", async () => {
            expect(isSimulating(order._id.toString())).toBe(false);
            await startSimulation(order._id.toString(), DEFAULT_TIMING);
            expect(isSimulating(order._id.toString())).toBe(true);
            stopSimulation(order._id.toString());
            expect(isSimulating(order._id.toString())).toBe(false);
        });
    });

    describe("the run itself", () => {
        // Compressed timings so the whole lifecycle completes in milliseconds.
        const fast = { acceptAfterMs: 5, prepareForMs: 5, deliverForMs: 20, tickEveryMs: 5 };
        const settle = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        /**
         * Polls rather than sleeping a fixed amount: each step of the run makes
         * its own database round-trip, so wall-clock timing is not something a
         * test can safely assume.
         */
        const waitForStatus = async (expected: string, timeoutMs = 4000) => {
            const deadline = Date.now() + timeoutMs;
            let seen: string | null | undefined;
            while (Date.now() < deadline) {
                seen = (await Order.findById(order._id))?.status;
                if (seen === expected) return;
                await settle(10);
            }
            throw new Error(`Order never reached "${expected}" (last saw "${seen}")`);
        };

        const waitFor = async (predicate: () => boolean, timeoutMs = 4000) => {
            const deadline = Date.now() + timeoutMs;
            while (Date.now() < deadline) {
                if (predicate()) return;
                await settle(10);
            }
            throw new Error("Condition never became true");
        };

        it("walks the order through every legal status in order", async () => {
            await startSimulation(order._id.toString(), fast);

            await waitForStatus("Preparing");
            await waitForStatus("Delivering");
            await waitForStatus("Delivered");
        });

        it("publishes courier positions into the order's own room", async () => {
            await startSimulation(order._id.toString(), fast);
            await waitForStatus("Delivered");

            // Every position update is scoped to the order id, which is the room
            // only its customer and courier are allowed to join.
            expect(io.to).toHaveBeenCalledWith(order._id.toString());
            expect(toEmit).toHaveBeenCalledWith("locationUpdate", expect.objectContaining({
                lat: expect.any(Number),
                lng: expect.any(Number),
            }));
        });

        it("ends the run at the customer's doorstep", async () => {
            await startSimulation(order._id.toString(), fast);
            await waitForStatus("Delivered");

            const positions = () => toEmit.mock.calls
                .filter(([event]) => event === "locationUpdate")
                .map(([, payload]) => payload as { lat: number; lng: number });

            await waitFor(() => positions().length > 1);
            const last = positions()[positions().length - 1];
            expect(last.lat).toBeCloseTo(CUSTOMER_POINT.lat, 6);
            expect(last.lng).toBeCloseTo(CUSTOMER_POINT.lng, 6);
        });

        it("stops advancing an order that was cancelled mid-flight", async () => {
            await startSimulation(order._id.toString(), fast);
            await waitForStatus("Preparing");

            await Order.findByIdAndUpdate(order._id, { status: "Cancelled" });
            await settle(80);

            // A queued step must never resurrect a cancelled order.
            expect((await Order.findById(order._id))?.status).toBe("Cancelled");
        });

        it("stopSimulation halts a run before it completes", async () => {
            await startSimulation(order._id.toString(), fast);
            stopSimulation(order._id.toString());
            await settle(80);

            expect((await Order.findById(order._id))?.status).toBe("Created");
        });
    });

    describe("the HTTP endpoint", () => {
        it("starts a simulation for the caller's own order", async () => {
            const res = await request(app)
                .post(`/api/demo/orders/${order._id}/simulate`)
                .set("Cookie", `token=${customerToken}`)
                .send({});

            expect(res.status).toBe(202);
            expect(res.body).toEqual({ started: true });
        });

        it("refuses to simulate someone else's order", async () => {
            const res = await request(app)
                .post(`/api/demo/orders/${order._id}/simulate`)
                .set("Cookie", `token=${otherCustomerToken}`)
                .send({});

            expect(res.status).toBe(404);
            expect(isSimulating(order._id.toString())).toBe(false);
        });

        it("refuses an anonymous caller", async () => {
            const res = await request(app).post(`/api/demo/orders/${order._id}/simulate`).send({});
            expect(res.status).toBe(401);
        });

        it("reports demo mode through the status endpoint", async () => {
            const res = await request(app).get("/api/demo/status");
            expect(res.body).toEqual({ simulationEnabled: true });
        });

        it("hides the whole feature when demo mode is off", async () => {
            delete process.env.DEMO_SIMULATION;

            const status = await request(app).get("/api/demo/status");
            expect(status.body).toEqual({ simulationEnabled: false });

            const res = await request(app)
                .post(`/api/demo/orders/${order._id}/simulate`)
                .set("Cookie", `token=${customerToken}`)
                .send({});

            // 404 rather than 403: a production deployment should not even
            // reveal that these routes exist.
            expect(res.status).toBe(404);
        });

        it("reports an already-running simulation without starting a second", async () => {
            await startSimulation(order._id.toString(), DEFAULT_TIMING);

            const res = await request(app)
                .post(`/api/demo/orders/${order._id}/simulate`)
                .set("Cookie", `token=${customerToken}`)
                .send({});

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ started: false, reason: "Already in progress" });
        });

        it("lets the owner stop a running simulation", async () => {
            await startSimulation(order._id.toString(), DEFAULT_TIMING);

            const res = await request(app)
                .delete(`/api/demo/orders/${order._id}/simulate`)
                .set("Cookie", `token=${customerToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ stopped: true });
            expect(isSimulating(order._id.toString())).toBe(false);
        });
    });
});
