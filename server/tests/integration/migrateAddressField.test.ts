import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import type { Db } from "mongodb";
import Order from "../../models/Order";
import { MIGRATION_TARGETS, migrateAddressField } from "../../scripts/migrate-address-field";

let mongo: MongoMemoryServer;
let db: Db;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    db = mongoose.connection.db as unknown as Db;
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

const OLD_ADDRESS = { city: "Kyiv", countryOrRegion: "Ukraine", street: "Yaroslaviv Val", houseNumber: 15 };

/**
 * This migration runs against real production data exactly once, so its edge
 * cases matter more than its happy path: it must be idempotent, it must not
 * touch already-correct documents, and it must refuse rather than destroy data
 * when both spellings are present.
 */
describe("adress -> address migration", () => {
    beforeEach(async () => {
        for (const name of MIGRATION_TARGETS) {
            await db.collection(name).deleteMany({});
        }
    });

    it("renames the field on legacy documents", async () => {
        // Inserted through the driver, not the model, so the schema does not
        // strip the field that no longer exists on it.
        await db.collection("orders").insertOne({ userId: new mongoose.Types.ObjectId(), adress: OLD_ADDRESS });

        const report = await migrateAddressField(db);

        expect(report.counts.orders).toBe(1);
        const migrated = await db.collection("orders").findOne({});
        expect(migrated?.address).toEqual(OLD_ADDRESS);
        expect(migrated?.adress).toBeUndefined();
    });

    it("migrates restaurants as well as orders", async () => {
        await db.collection("orders").insertOne({ adress: OLD_ADDRESS });
        await db.collection("restaurants").insertOne({ title: "Legacy Grill", adress: { city: "Kyiv", street: "Main", houseNumber: 1 } });

        const report = await migrateAddressField(db);

        expect(report.total).toBe(2);
        expect((await db.collection("restaurants").findOne({}))?.address).toBeDefined();
    });

    it("preserves the nested shape rather than flattening it", async () => {
        await db.collection("orders").insertOne({ adress: OLD_ADDRESS });

        await migrateAddressField(db);

        const migrated = await db.collection("orders").findOne({});
        expect(migrated?.address.street).toBe("Yaroslaviv Val");
        expect(migrated?.address.houseNumber).toBe(15);
        expect(migrated?.address.countryOrRegion).toBe("Ukraine");
    });

    it("leaves already-migrated documents untouched", async () => {
        await db.collection("orders").insertOne({ address: OLD_ADDRESS });

        const report = await migrateAddressField(db);

        expect(report.total).toBe(0);
        expect((await db.collection("orders").findOne({}))?.address).toEqual(OLD_ADDRESS);
    });

    it("is idempotent — a second run changes nothing", async () => {
        await db.collection("orders").insertOne({ adress: OLD_ADDRESS });

        const first = await migrateAddressField(db);
        const second = await migrateAddressField(db);

        expect(first.total).toBe(1);
        expect(second.total).toBe(0);
        expect((await db.collection("orders").findOne({}))?.address).toEqual(OLD_ADDRESS);
    });

    it("refuses to run when a document carries both spellings", async () => {
        // $rename would silently discard `address` here, so the migration must
        // stop rather than destroy the newer value.
        const newer = { city: "Lviv", countryOrRegion: "Ukraine", street: "Rynok", houseNumber: 1 };
        await db.collection("orders").insertOne({ adress: OLD_ADDRESS, address: newer });

        await expect(migrateAddressField(db)).rejects.toThrow(/BOTH "adress" and "address"/);

        // Nothing was written.
        const untouched = await db.collection("orders").findOne({});
        expect(untouched?.address).toEqual(newer);
        expect(untouched?.adress).toEqual(OLD_ADDRESS);
    });

    it("reports without writing in dry-run mode", async () => {
        await db.collection("orders").insertOne({ adress: OLD_ADDRESS });

        const report = await migrateAddressField(db, { dryRun: true });

        expect(report.dryRun).toBe(true);
        expect(report.total).toBe(1);
        // Still the old spelling — a dry run must not modify anything.
        const untouched = await db.collection("orders").findOne({});
        expect(untouched?.adress).toEqual(OLD_ADDRESS);
        expect(untouched?.address).toBeUndefined();
    });

    it("handles a mix of migrated and legacy documents in one pass", async () => {
        await db.collection("orders").insertMany([
            { adress: OLD_ADDRESS },
            { address: OLD_ADDRESS },
            { adress: OLD_ADDRESS },
        ]);

        const report = await migrateAddressField(db);

        expect(report.counts.orders).toBe(2);
        expect(await db.collection("orders").countDocuments({ address: { $exists: true } })).toBe(3);
        expect(await db.collection("orders").countDocuments({ adress: { $exists: true } })).toBe(0);
    });

    it("leaves a migrated order readable through the Mongoose model", async () => {
        await db.collection("orders").insertOne({
            userId: new mongoose.Types.ObjectId(),
            restaurantTitle: "Legacy Grill",
            restaurantImage: "img.jpg",
            approxTime: 30,
            totalPrice: 20,
            items: [],
            status: "Created",
            adress: OLD_ADDRESS,
        });

        await migrateAddressField(db);

        // The point of the migration: the model can now see the address.
        const order = await Order.findOne({ restaurantTitle: "Legacy Grill" });
        expect(order?.address?.street).toBe("Yaroslaviv Val");
        expect(order?.address?.city).toBe("Kyiv");
    });
});
