// Global manual mock (wired via jest.config.js moduleNameMapper) — every test
// file gets this instead of the real SDK, so the fire-and-forget email calls
// sprinkled through checkout/status-change/cancellation never make a real
// network request during a test run. Tests that care about email content
// import { resend } from "../../utils/emailClient" and inspect
// resend.emails.send.mock.calls directly.
export class Resend {
    emails = {
        send: jest.fn(async () => ({ data: { id: "mock-email-id" }, error: null })),
    };
    // Mirrors the real SDK's own constructor validation — it throws
    // synchronously when the key is missing/empty, which is exactly the
    // behavior emailClient.ts's fallback has to guard against (a real
    // incident: RESEND_API_KEY unset in production crashed the whole server
    // at boot). A mock that never throws wouldn't actually exercise that path.
    constructor(apiKey?: string) {
        if (!apiKey) throw new Error("Missing API key. Pass it to the constructor `new Resend(\"re_123\")`");
    }
}
