import dotenv from "dotenv";
import { Resend } from "resend";
dotenv.config();

// Unlike Stripe's client, Resend's constructor throws synchronously when the
// API key is missing/empty — with RESEND_API_KEY unset (as it was on the
// live Render deploy, which only ever had a local placeholder in the
// gitignored server/.env), that crashed the entire server at boot, before it
// could even bind to a port. Email is explicitly a non-critical,
// fire-and-forget feature (see sendOrderEmail.ts) — a missing key should
// just disable it, not take the whole app down. Falls back to a stub whose
// .send() rejects, which sendOrderEmail's existing .catch() already handles.
const createClient = (): Resend => {
    try {
        return new Resend(process.env.RESEND_API_KEY!);
    } catch (err) {
        console.error("[email] Resend client disabled — RESEND_API_KEY is missing or invalid:", err);
        return {
            emails: {
                send: async () => {
                    throw new Error("Email disabled: RESEND_API_KEY is not configured");
                },
            },
        } as unknown as Resend;
    }
};

// Same shape as stripeClient.ts — a single shared client rather than
// constructing one per call site.
export const resend = createClient();
