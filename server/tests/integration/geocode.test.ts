import request from "supertest";
import { app } from "../../app";

describe("geocode proxy", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it("forwards a successful Nominatim response as JSON, with an identifying User-Agent", async () => {
        const mockFetch = jest.fn(async (url: string, init?: RequestInit) => {
            expect(String(url)).toContain("nominatim.openstreetmap.org");
            expect((init?.headers as Record<string, string>)?.["User-Agent"]).toBeTruthy();
            return {
                json: async () => [{ lat: "1.23", lon: "4.56" }],
            } as Response;
        });
        global.fetch = mockFetch as unknown as typeof fetch;

        const res = await request(app).get("/api/geocode").query({ q: "Kyiv" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual([{ lat: "1.23", lon: "4.56" }]);
    });

    it("502s instead of leaking Express's default HTML error page when the upstream call fails", async () => {
        global.fetch = jest.fn(async () => { throw new Error("network error"); }) as unknown as typeof fetch;

        const res = await request(app).get("/api/geocode").query({ q: "Kyiv" });

        expect(res.status).toBe(502);
        expect(res.body).toEqual({ message: "Geocoding service unavailable" });
    });
});
