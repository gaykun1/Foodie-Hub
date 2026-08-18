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
