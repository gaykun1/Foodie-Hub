/**
 * Renames the misspelled `adress` field to `address` on existing documents.
 *
 *   npm run migrate:address -- --dry-run   # report what would change
 *   npm run migrate:address                # apply
 *
 * Why this exists: the field was spelled `adress` in the Order and Restaurant
 * schemas. Code now reads `address`, so any document written before that change
 * would silently present an undefined address — a delivery with no street, and
 * a tracking map with nothing to plot.
 *
 * Safe to run repeatedly: `$rename` only matches documents that still have the
 * old field, so a second run reports zero and does nothing.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import type { Db } from "mongodb";

dotenv.config();

/** Collections carrying the old spelling. */
export const MIGRATION_TARGETS = ["orders", "restaurants"] as const;

export interface MigrationReport {
    /** Per collection: how many documents were (or would be) renamed. */
    counts: Record<string, number>;
    total: number;
    dryRun: boolean;
}

/**
 * Performs the rename. Exported so it can be tested against a real database
 * rather than only exercised by running the script by hand.
 */
export const migrateAddressField = async (
    db: Db,
    { dryRun = false }: { dryRun?: boolean } = {}
): Promise<MigrationReport> => {
    const counts: Record<string, number> = {};
    let total = 0;

    for (const name of MIGRATION_TARGETS) {
        const collection = db.collection(name);

        // A document that somehow has both fields would lose `address` to the
        // rename, so refuse rather than silently overwrite the newer data.
        const conflicted = await collection.countDocuments({
            adress: { $exists: true },
            address: { $exists: true },
        });
        if (conflicted > 0) {
            throw new Error(
                `${name}: ${conflicted} document(s) have BOTH "adress" and "address". ` +
                `Resolve these by hand before migrating — $rename would discard the newer field.`
            );
        }

        const filter = { adress: { $exists: true } };
        const pending = await collection.countDocuments(filter);

        if (pending === 0 || dryRun) {
            counts[name] = pending;
            total += pending;
            continue;
        }

        const result = await collection.updateMany(filter, { $rename: { adress: "address" } });
        counts[name] = result.modifiedCount;
        total += result.modifiedCount;
    }

    return { counts, total, dryRun };
};

const log = (message: string) => console.log(`[migrate:address] ${message}`);

const run = async () => {
    const dryRun = process.argv.includes("--dry-run");

    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not set — copy .env.example to server/.env first.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    if (!db) throw new Error("No database handle after connecting.");
    log(`connected to ${mongoose.connection.name}${dryRun ? " (dry run)" : ""}`);

    const report = await migrateAddressField(db as unknown as Db, { dryRun });

    for (const [name, count] of Object.entries(report.counts)) {
        if (count === 0) {
            log(`${name}: nothing to migrate`);
        } else if (dryRun) {
            log(`${name}: would rename "adress" -> "address" on ${count} document(s)`);
        } else {
            log(`${name}: renamed on ${count} document(s)`);
        }
    }

    log(dryRun
        ? `dry run complete — ${report.total} document(s) would change`
        : `done — ${report.total} document(s) updated`);

    await mongoose.disconnect();
};

// Only self-executes when run as a script, so importing it from a test is inert.
if (require.main === module) {
    run().catch(async (err) => {
        console.error("[migrate:address] failed:", err instanceof Error ? err.message : err);
        await mongoose.disconnect().catch(() => undefined);
        process.exit(1);
    });
}
