"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const stripe_1 = __importDefault(require("stripe"));
dotenv_1.default.config();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
});
const createPaymentIntent = async (req, res) => {
    const { amount } = req.body;
    console.log(amount);
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            automatic_payment_methods: { enabled: true },
        });
        res.status(200).json({
            clientSecret: paymentIntent.client_secret
        });
        return;
    }
    catch (err) {
        res.status(400).json({ message: `Failed: ${err}` });
        return;
    }
};
exports.createPaymentIntent = createPaymentIntent;
