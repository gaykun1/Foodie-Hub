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
    constructor(_apiKey?: string) { }
}
