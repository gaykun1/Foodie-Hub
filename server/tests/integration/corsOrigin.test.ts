/**
 * Unit coverage for resolveCorsOrigin — a one-line function, but the
 * behavior it encodes matters: the `cors` package treats a falsy `origin`
 * option as "allow any origin", so an unset CORS_ORIGIN previously left both
 * the REST API (app.ts) and socket.io (socket.ts) wide open to credentialed
 * cross-origin requests from any site. This pins the fail-closed direction.
 */
describe("resolveCorsOrigin", () => {
    const ORIGINAL_ENV = process.env.CORS_ORIGIN;

    afterEach(() => {
        process.env.CORS_ORIGIN = ORIGINAL_ENV;
        jest.resetModules();
    });

    it("passes through a configured origin", async () => {
        jest.resetModules();
        process.env.CORS_ORIGIN = "https://app.example.com";
        const { resolveCorsOrigin } = await import("../../utils/corsOrigin");

        expect(resolveCorsOrigin()).toBe("https://app.example.com");
    });

    it("fails closed (false, not '*') when CORS_ORIGIN is unset", async () => {
        jest.resetModules();
        delete process.env.CORS_ORIGIN;
        const { resolveCorsOrigin } = await import("../../utils/corsOrigin");

        expect(resolveCorsOrigin()).toBe(false);
    });

    it("fails closed when CORS_ORIGIN is set to an empty string", async () => {
        jest.resetModules();
        process.env.CORS_ORIGIN = "";
        const { resolveCorsOrigin } = await import("../../utils/corsOrigin");

        expect(resolveCorsOrigin()).toBe(false);
    });
});
