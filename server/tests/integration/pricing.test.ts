import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User, { IUserDocument } from "../../models/User";
import Order from "../../models/Order";
import Promocode from "../../models/Promocode";
import { VALID_SHIPPING_PRICES, computeOrderPricing, getMaxDiscountPercent } from "../../utils/pricing";

let mongo: MongoMemoryServer;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongo.stop();
});

/**
 * Checkout arithmetic is the part of this app where a bug costs real money, and
 * the server deliberately recomputes it from its own data rather than trusting
 * the client. These tests pin the formula, the shipping whitelist and the
 * discount ceiling.
 */
describe("checkout pricing", () => {
    let user: IUserDocument;

    const draftOrderWith = async (items: { price: number; amount: number }[]) => {
        await Order.create({
            userId: user._id,
            items: items.map((item, i) => ({
                title: `Item ${i}`,
                imageUrl: "img.jpg",
                price: item.price,
                amount: item.amount,
            })),
            restaurantTitle: "Test Restaurant",
            restaurantImage: "img.jpg",
            approxTime: 0,
            totalPrice: 0,
            status: null,
        });
    };

    beforeEach(async () => {
        await Promise.all([
            User.deleteMany({}),
            Order.deleteMany({}),
            Promocode.deleteMany({}),
        ]);
        user = await User.create({ username: `pricing_${Date.now()}`, password: "x" });
    });

    describe("subtotal", () => {
        it("multiplies each line by its quantity", async () => {
            await draftOrderWith([{ price: 10, amount: 3 }, { price: 4.5, amount: 2 }]);

            const pricing = await computeOrderPricing(user._id, 2.2, 0);

            expect(pricing?.subtotal).toBe(39);
        });

        it("handles a single-item order", async () => {
            await draftOrderWith([{ price: 12.99, amount: 1 }]);

            const pricing = await computeOrderPricing(user._id, 2.2, 0);

            expect(pricing?.subtotal).toBeCloseTo(12.99, 2);
        });

        it("returns null when there is no draft order to price", async () => {
            expect(await computeOrderPricing(user._id, 2.2, 0)).toBeNull();
        });

        it("ignores an already-placed order — only the draft is priced", async () => {
            await Order.create({
                userId: user._id,
                items: [{ title: "Placed", imageUrl: "img.jpg", price: 99, amount: 1 }],
                restaurantTitle: "Test Restaurant", restaurantImage: "img.jpg",
                approxTime: 30, totalPrice: 99, status: "Created",
            });

            expect(await computeOrderPricing(user._id, 2.2, 0)).toBeNull();
        });
    });

    describe("shipping", () => {
        it.each(VALID_SHIPPING_PRICES)("adds the %s shipping tier to the subtotal", async (shipping) => {
            await draftOrderWith([{ price: 20, amount: 1 }]);

            const pricing = await computeOrderPricing(user._id, shipping, 0);

            expect(pricing?.shippingPrice).toBe(shipping);
            expect(pricing?.totalPrice).toBeCloseTo(20 + shipping, 2);
        });

        it.each([0, -5, 1.5, 99, 2.21])("rejects %s, which is not an offered tier", async (shipping) => {
            await draftOrderWith([{ price: 20, amount: 1 }]);

            // Never trust a client-supplied shipping price: without the
            // whitelist a caller could ship for free, or for a negative amount.
            await expect(computeOrderPricing(user._id, shipping, 0)).rejects.toThrow("Invalid shipping option");
        });
    });

    describe("discounts", () => {
        it("applies the percentage to subtotal plus shipping", async () => {
            await draftOrderWith([{ price: 50, amount: 1 }]);
            const promo = await Promocode.create({ code: "HALF", discountPercent: 50, type: "Special" });
            user.promocodes = [promo._id];
            await user.save();

            const pricing = await computeOrderPricing(user._id, 2.2, 50);

            // (50 + 2.20) * 0.5
            expect(pricing?.discountPercent).toBe(50);
            expect(pricing?.totalPrice).toBeCloseTo(26.1, 2);
        });

        it("charges the full amount when the user holds no promocodes", async () => {
            await draftOrderWith([{ price: 30, amount: 1 }]);

            const pricing = await computeOrderPricing(user._id, 3.2, 0);

            expect(pricing?.discountPercent).toBe(0);
            expect(pricing?.totalPrice).toBeCloseTo(33.2, 2);
        });

        it("clamps a claimed discount down to what the user actually holds", async () => {
            await draftOrderWith([{ price: 100, amount: 1 }]);
            const promo = await Promocode.create({ code: "TEN", discountPercent: 10, type: "Special" });
            user.promocodes = [promo._id];
            await user.save();

            // The client asks for 90% off while holding a 10% code.
            const pricing = await computeOrderPricing(user._id, 2.2, 90);

            expect(pricing?.discountPercent).toBe(10);
            expect(pricing?.totalPrice).toBeCloseTo((100 + 2.2) * 0.9, 2);
        });

        it("clamps a negative discount to zero rather than inflating the total", async () => {
            await draftOrderWith([{ price: 10, amount: 1 }]);

            const pricing = await computeOrderPricing(user._id, 2.2, -50);

            expect(pricing?.discountPercent).toBe(0);
            expect(pricing?.totalPrice).toBeCloseTo(12.2, 2);
        });

        it("sums a standing weekend code with redeemed one-time codes", async () => {
            const usual = await Promocode.create({ code: "WEEKEND", discountPercent: 15, type: "Usual" });
            const special = await Promocode.create({ code: "EXTRA", discountPercent: 5, type: "Special" });
            user.usualPromocode = usual._id;
            user.promocodes = [special._id];
            await user.save();

            expect(await getMaxDiscountPercent(user._id)).toBe(20);
        });

        it("gives an unknown user no discount headroom at all", async () => {
            expect(await getMaxDiscountPercent(new mongoose.Types.ObjectId())).toBe(0);
        });

        it("rounds the total to two decimal places", async () => {
            await draftOrderWith([{ price: 9.99, amount: 3 }]);
            const promo = await Promocode.create({ code: "SEVEN", discountPercent: 7, type: "Special" });
            user.promocodes = [promo._id];
            await user.save();

            const pricing = await computeOrderPricing(user._id, 5.2, 7);

            // (29.97 + 5.20) * 0.93 = 32.7081 -> 32.71
            expect(pricing?.totalPrice).toBe(32.71);
            expect(String(pricing?.totalPrice).split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
        });

        it("never produces a negative total, even at a 100% discount", async () => {
            await draftOrderWith([{ price: 10, amount: 1 }]);
            const promo = await Promocode.create({ code: "FREE", discountPercent: 100, type: "Special" });
            user.promocodes = [promo._id];
            await user.save();

            const pricing = await computeOrderPricing(user._id, 2.2, 100);

            expect(pricing?.totalPrice).toBe(0);
        });
    });
});
