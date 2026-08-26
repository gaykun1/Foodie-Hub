import { act, render, screen } from "@testing-library/react";
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { ColdStartNotice } from "../ColdStartNotice";
import { apiClient, getPendingSince } from "@/lib/apiClient";
import { BACKEND_WAKING_DELAY_MS } from "@/hooks/useBackendWaking";

/**
 * Swaps in a controllable transport rather than mocking the tracking store, so
 * the real request/response interceptors in apiClient are exercised too.
 * Each queued entry is settled by hand to model a slow (cold-starting) server.
 */
const ok = (config: InternalAxiosRequestConfig): AxiosResponse => ({
    data: {},
    status: 200,
    statusText: "OK",
    headers: {},
    config,
});

let settlers: Array<{ resolve: () => void; reject: () => void }>;
let realAdapter: AxiosAdapter | undefined;

beforeEach(() => {
    jest.useFakeTimers();
    settlers = [];
    realAdapter = apiClient.defaults.adapter as AxiosAdapter | undefined;
    apiClient.defaults.adapter = ((config: InternalAxiosRequestConfig) =>
        new Promise<AxiosResponse>((resolve, reject) => {
            settlers.push({
                resolve: () => resolve(ok(config)),
                reject: () => reject(new Error("request failed")),
            });
        })) as AxiosAdapter;
});

afterEach(async () => {
    // Tests that leave a request deliberately hanging must not leak: the
    // in-flight counter lives at module scope in apiClient, so an unsettled
    // request would keep it above zero and every later test would start out
    // already "waiting".
    await act(async () => {
        for (const settler of settlers) settler.resolve();
        await drain();
    });
    apiClient.defaults.adapter = realAdapter;
    jest.useRealTimers();
});

/**
 * Drains the microtask queue. A single tick is not enough: axios hops through
 * several promises (adapter -> dispatchRequest -> the interceptor chain) before
 * the tracking counter settles.
 */
const drain = async () => {
    for (let i = 0; i < 20; i += 1) await Promise.resolve();
};

/** Lets the request interceptor and any queued microtasks run. */
const flush = () => act(async () => { await drain(); });

/** Settles the nth queued request and lets the result propagate. */
const settle = (index: number, outcome: "resolve" | "reject" = "resolve") =>
    act(async () => {
        settlers[index][outcome]();
        await drain();
    });

const noticeText = /waking the server up/i;

describe("ColdStartNotice", () => {
    it("stays hidden while nothing is in flight", () => {
        render(<ColdStartNotice />);
        expect(screen.queryByText(noticeText)).not.toBeInTheDocument();
    });

    it("stays hidden for a request that answers quickly", async () => {
        render(<ColdStartNotice />);

        void apiClient.get("/quick");
        await flush();
        await settle(0);

        // The warm request settled inside the delay, so the pending timer was
        // cleared before it could ever fire.
        act(() => { jest.advanceTimersByTime(BACKEND_WAKING_DELAY_MS * 2); });

        expect(screen.queryByText(noticeText)).not.toBeInTheDocument();
    });

    it("appears once a request has been pending past the delay", async () => {
        render(<ColdStartNotice />);

        void apiClient.get("/slow");
        await flush();
        expect(screen.queryByText(noticeText)).not.toBeInTheDocument();

        act(() => { jest.advanceTimersByTime(BACKEND_WAKING_DELAY_MS); });

        expect(screen.getByText(noticeText)).toBeInTheDocument();
    });

    it("clears the notice once the slow request finally settles", async () => {
        render(<ColdStartNotice />);

        void apiClient.get("/slow");
        await flush();
        act(() => { jest.advanceTimersByTime(BACKEND_WAKING_DELAY_MS); });
        expect(screen.getByText(noticeText)).toBeInTheDocument();

        await settle(0);

        expect(screen.queryByText(noticeText)).not.toBeInTheDocument();
    });

    it("clears the notice when a slow request fails rather than sticking", async () => {
        render(<ColdStartNotice />);

        void apiClient.get("/slow-fail").catch(() => {});
        await flush();
        act(() => { jest.advanceTimersByTime(BACKEND_WAKING_DELAY_MS); });
        expect(screen.getByText(noticeText)).toBeInTheDocument();

        // The rejection path has to settle the counter too, or a failed request
        // would leave the notice on screen forever.
        await settle(0, "reject");

        expect(screen.queryByText(noticeText)).not.toBeInTheDocument();
    });
});

describe("pending-request tracking", () => {
    it("treats parallel requests as one continuous wait", async () => {
        void apiClient.get("/a");
        void apiClient.get("/b");
        await flush();

        const since = getPendingSince();
        expect(since).not.toBeNull();

        await settle(0);
        // The first response landing must not reset the clock — still waiting.
        expect(getPendingSince()).toBe(since);

        await settle(1);
        expect(getPendingSince()).toBeNull();
    });
});
