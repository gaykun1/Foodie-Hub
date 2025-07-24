import { loadStripe } from '@stripe/stripe-js';
// promise for Stripe container
let stripePromise;
const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    }
    return stripePromise;
};

export default getStripe;