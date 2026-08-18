import dotenv from "dotenv";
import { Resend } from "resend";
dotenv.config();

// Same shape as stripeClient.ts — a single shared client rather than
// constructing one per call site.
export const resend = new Resend(process.env.RESEND_API_KEY!);
