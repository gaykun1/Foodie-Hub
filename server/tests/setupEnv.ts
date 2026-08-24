/**
 * Environment defaults for the test suite.
 *
 * The suite used to depend on whatever was in a developer's gitignored
 * `server/.env` — signing JWTs with `process.env.JWT_SECRET!` and, less
 * obviously, needing `RESEND_API_KEY` set for the mocked Resend constructor to
 * succeed at all. That passed locally and failed on a clean checkout (and in
 * CI), which is exactly backwards.
 *
 * Runs via `setupFiles`, so these land before any module reads them. Values are
 * only filled in when absent, so a test that deliberately overrides one (see
 * emailClient.test.ts blanking RESEND_API_KEY) still controls its own world.
 */
const defaults: Record<string, string> = {
    JWT_SECRET: "test-jwt-secret",
    // Never used against the network: every test either mocks the Stripe client
    // or asserts on the mock, but the client is constructed at import time and
    // so needs *something*. Deliberately not shaped like a real key ("sk_test_"
    // prefix and all) so secret scanners do not flag this file.
    STRIPE_SECRET_KEY: "stripe-key-not-used-in-tests",
    // Must be non-empty: the mocked Resend constructor mirrors the real SDK and
    // throws without a key, which would make emailClient fall back to its
    // non-mock stub and silently break every email assertion.
    RESEND_API_KEY: "re_test_placeholder",
    ORDER_EMAIL_FROM: "FoodieHub <orders@example.test>",
    CORS_ORIGIN: "http://localhost:3000",
};

for (const [key, value] of Object.entries(defaults)) {
    if (!process.env[key]) {
        process.env[key] = value;
    }
}
