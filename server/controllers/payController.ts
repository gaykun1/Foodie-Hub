import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { computeOrderPricing } from "../utils/pricing";
import { stripe } from "../utils/stripeClient";
// Amount is derived server-side from the caller's own pending order, never
// taken from the client, so a tampered request can't buy a real order for cents.
export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
    const { shipping, percent } = req.body;

    try {
        const pricing = await computeOrderPricing((req as AuthRequest).userId, shipping, percent);
        if (!pricing) {
            res.status(404).json({ message: "No pending order found" });
            return;
        }
        const amount = Math.round(pricing.totalPrice * 100);
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            automatic_payment_methods: { enabled: true },
        })
        res.status(200).json({
            clientSecret: paymentIntent.client_secret
        })
        return;
    } catch (err) {
        // Was interpolating the raw error (a Stripe API error, or the
        // "Invalid shipping option" thrown by computeOrderPricing) straight
        // into the response — neither the client UI displays it nor should a
        // caller be handed that much detail about the server's internals.
        console.error("[createPaymentIntent] error:", err);
        res.status(400).json({ message: "Could not start payment" });
        return;
    }
}

