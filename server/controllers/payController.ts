import dotenv from "dotenv";
import { Request, Response } from "express";
import Stripe from "stripe";
dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-06-30.basil",
});
export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
    const { amount } = req.body;
    console.log(amount);
    try {
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
        res.status(400).json({ message: `Failed: ${err}` });
        return;
    }
}

