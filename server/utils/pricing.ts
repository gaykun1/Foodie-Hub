import mongoose from "mongoose";
import Order, { IOrderDocument } from "../models/Order";
import User from "../models/User";
import { IPromocode } from "../models/Promocode";

// Must mirror client/src/redux/reduxTypes.ts Shipping enum — the server can't
// trust a client-supplied shipping price, so it only accepts these values.
export const VALID_SHIPPING_PRICES = [2.2, 3.2, 5.2];

// A user's real discount ceiling: their standing "Usual" promocode plus every
// "Special" one-time code they've legitimately redeemed via usePromocode.
// Anything a client claims beyond this sum gets clamped down.
export const getMaxDiscountPercent = async (userId: string | mongoose.Types.ObjectId): Promise<number> => {
    const user = await User.findById(userId)
        .populate<{ usualPromocode: IPromocode | null }>("usualPromocode")
        .populate<{ promocodes: IPromocode[] }>("promocodes");
    if (!user) return 0;
    let max = 0;
    if (user.usualPromocode && typeof user.usualPromocode.discountPercent === "number") {
        max += user.usualPromocode.discountPercent;
    }
    if (user.promocodes) {
        for (const promo of user.promocodes) {
            if (promo && typeof promo.discountPercent === "number") {
                max += promo.discountPercent;
            }
        }
    }
    return max;
};

export type PricingResult = {
    order: IOrderDocument;
    subtotal: number;
    shippingPrice: number;
    discountPercent: number;
    totalPrice: number;
};

// Recomputes the order total entirely from server-trusted data: the order's own
// persisted items, a whitelisted shipping price, and a discount clamped to what
// the user actually qualifies for. Never trust a client-supplied total/amount —
// it was previously forwarded as-is to both the Order and Stripe (price tampering).
export const computeOrderPricing = async (
    userId: string | mongoose.Types.ObjectId,
    requestedShipping: number,
    requestedPercent: number
): Promise<PricingResult | null> => {
    const order = await Order.findOne({ userId, status: null });
    if (!order) return null;

    if (!VALID_SHIPPING_PRICES.includes(requestedShipping)) {
        throw new Error("Invalid shipping option");
    }

    const maxDiscount = await getMaxDiscountPercent(userId);
    const discountPercent = Math.min(Math.max(requestedPercent || 0, 0), maxDiscount);

    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.amount, 0);
    const totalPrice = +(((subtotal + requestedShipping) * (100 - discountPercent)) / 100).toFixed(2);

    return { order, subtotal, shippingPrice: requestedShipping, discountPercent, totalPrice };
};

/**
 * Consumes exactly the Special (one-time) promocodes that funded
 * `discountPercent` on a just-paid order, so they stop counting toward every
 * future order's discount ceiling forever.
 *
 * `usePromocode` (promocodeController) marks a Special code globally used and
 * pushes it onto `user.promocodes` — but nothing ever removed it again, and
 * `getMaxDiscountPercent` above sums every code still sitting in that array
 * on *every* checkout. A user who redeemed one 20%-off one-time code could
 * keep applying that same 20% to every order they placed from then on.
 *
 * The standing "Usual" promocode is deliberately left alone — it's the
 * weekend-style discount meant to be reused. Only the slice of
 * `discountPercent` beyond what "Usual" alone accounts for came from Special
 * codes, so only that much is removed, oldest-redeemed first, stopping as
 * soon as enough has been accounted for. Call this once, after the order is
 * actually confirmed paid — not at redemption time, when it's still unknown
 * whether (or how much of) the code will end up used.
 */
export const consumeSpecialPromocodes = async (
    userId: string | mongoose.Types.ObjectId,
    discountPercent: number
): Promise<void> => {
    if (!discountPercent || discountPercent <= 0) return;

    const user = await User.findById(userId)
        .populate<{ usualPromocode: IPromocode | null }>("usualPromocode")
        .populate<{ promocodes: (IPromocode & { _id: mongoose.Types.ObjectId })[] }>("promocodes");
    if (!user || !user.promocodes?.length) return;

    const usualDiscount = user.usualPromocode && typeof user.usualPromocode.discountPercent === "number"
        ? user.usualPromocode.discountPercent
        : 0;

    let fundedBySpecial = discountPercent - usualDiscount;
    if (fundedBySpecial <= 0) return;

    const toRemove: mongoose.Types.ObjectId[] = [];
    for (const promo of user.promocodes) {
        if (fundedBySpecial <= 0) break;
        if (!promo || typeof promo.discountPercent !== "number") continue;
        toRemove.push(promo._id);
        fundedBySpecial -= promo.discountPercent;
    }
    if (!toRemove.length) return;

    await User.updateOne({ _id: userId }, { $pull: { promocodes: { $in: toRemove } } });
};
