module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.test.ts"],
    // Fills in the env vars the suite needs before any module reads them, so a
    // clean checkout (and CI) behaves the same as a developer machine with a
    // populated .env. See tests/setupEnv.ts.
    setupFiles: ["<rootDir>/tests/setupEnv.ts"],
    // Every test gets the mocked Resend client (tests/__mocks__/resend.ts) —
    // fire-and-forget order emails are triggered from several existing flows
    // (checkout, status change, cancellation) and must never make a real
    // network call during a test run.
    moduleNameMapper: {
        "^resend$": "<rootDir>/tests/__mocks__/resend.ts",
    },
};
