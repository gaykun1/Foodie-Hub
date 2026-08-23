// Regression test for a real production incident: RESEND_API_KEY was never
// configured on the live Render deploy (only a local placeholder existed in
// the gitignored server/.env), and Resend's constructor throws synchronously
// when the key is missing/empty — unlike Stripe's client, which doesn't
// validate eagerly. That crashed the entire server at boot, before it could
// even bind to a port, even though email is supposed to be a non-critical,
// fire-and-forget feature.
describe("email client resilience", () => {
    const originalKey = process.env.RESEND_API_KEY;

    afterEach(() => {
        process.env.RESEND_API_KEY = originalKey;
        jest.resetModules();
    });

    // Set to "" rather than deleted: emailClient.ts calls dotenv.config() on
    // every fresh module load, and dotenv only skips a key that's *already*
    // present in process.env — deleting it lets dotenv silently refill it
    // from the real server/.env file on disk, which defeats the point of
    // simulating "no key available" here regardless of local dev state.
    it("does not throw when required with no RESEND_API_KEY configured", () => {
        process.env.RESEND_API_KEY = "";
        jest.resetModules();
        expect(() => require("../../utils/emailClient")).not.toThrow();
    });

    it("falls back to a stub client whose send() rejects, rather than one that's missing entirely", async () => {
        process.env.RESEND_API_KEY = "";
        jest.resetModules();
        const { resend } = require("../../utils/emailClient");
        await expect(resend.emails.send({})).rejects.toThrow();
    });

    it("still constructs a real, working client when a key is present", () => {
        process.env.RESEND_API_KEY = "re_test_present";
        jest.resetModules();
        const { resend } = require("../../utils/emailClient");
        expect(resend).toBeDefined();
        expect(typeof resend.emails.send).toBe("function");
    });
});
