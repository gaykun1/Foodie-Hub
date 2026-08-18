import dotenv from "dotenv";
import Stripe from "stripe";
dotenv.config();

// Single shared client — payController and orderController both need it
// (the latter to verify a PaymentIntent actually succeeded before finalizing
// an order), and constructing it twice would be wasteful and, in tests,
// awkward to mock consistently.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-06-30.basil",
});
