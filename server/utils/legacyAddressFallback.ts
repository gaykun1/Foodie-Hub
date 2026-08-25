import type { Schema } from "mongoose";

/**
 * Backfills `address` from the old misspelled `adress` field on documents
 * written before that rename, so the API never sends a response with
 * `address: undefined` for data the migration script hasn't reached yet.
 *
 * Why this exists, not just the migration: `server/scripts/migrate-address-field.ts`
 * is the correct permanent fix, but it is a manual, one-off operation against a
 * specific deployment's database — it does not run itself. Between the schema
 * rename shipping and someone actually running it, every existing Order and
 * Restaurant document in a live database still has `adress`, not `address`.
 * The client reads `restaurant.address.street` unconditionally (this is a
 * normal, valid field per the current schema), so an un-migrated document
 * crashed the whole page with an uncaught TypeError in production.
 *
 * `adress` is stripped from the output — it was never part of the public
 * shape, so nothing should come to depend on it being there.
 */
export const applyLegacyAddressFallback = (schema: Schema): void => {
    const transform = (_doc: unknown, ret: Record<string, unknown>) => {
        if (!ret.address && ret.adress) {
            ret.address = ret.adress;
        }
        delete ret.adress;
        return ret;
    };

    schema.set("toJSON", { ...schema.get("toJSON"), transform });
    schema.set("toObject", { ...schema.get("toObject"), transform });
};
