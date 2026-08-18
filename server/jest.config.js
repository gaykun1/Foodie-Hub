module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.test.ts"],
    // Every test gets the mocked Resend client (tests/__mocks__/resend.ts) —
    // fire-and-forget order emails are triggered from several existing flows
    // (checkout, status change, cancellation) and must never make a real
    // network call during a test run.
    moduleNameMapper: {
        "^resend$": "<rootDir>/tests/__mocks__/resend.ts",
    },
}