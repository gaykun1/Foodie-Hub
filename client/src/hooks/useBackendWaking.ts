"use client";
import { useEffect, useState } from "react";
import { getPendingSince, subscribeToPendingRequests } from "@/lib/apiClient";

/**
 * How long the app waits on the backend before admitting something is slow.
 *
 * A warm request answers in roughly 200ms, so this never fires during normal
 * use — it only trips on a cold start, where the wait is tens of seconds.
 */
export const BACKEND_WAKING_DELAY_MS = 4000;

/**
 * True once the app has been continuously waiting on the backend for longer
 * than `delayMs` — i.e. the free-tier server is almost certainly cold-starting.
 * Returns false again as soon as the requests settle.
 */
export const useBackendWaking = (delayMs: number = BACKEND_WAKING_DELAY_MS): boolean => {
    const [waking, setWaking] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;

        const clearTimer = () => {
            if (timer !== undefined) {
                clearTimeout(timer);
                timer = undefined;
            }
        };

        // Re-evaluated on every 0 <-> 1 transition of the in-flight count.
        const sync = () => {
            clearTimer();
            const since = getPendingSince();
            if (since === null) {
                setWaking(false);
                return;
            }
            // Elapsed is measured from when waiting began, not from now, so a
            // subscriber mounting mid-wait still shows the notice on schedule.
            const remaining = delayMs - (Date.now() - since);
            if (remaining <= 0) {
                setWaking(true);
                return;
            }
            timer = setTimeout(() => setWaking(true), remaining);
        };

        sync();
        const unsubscribe = subscribeToPendingRequests(sync);
        return () => {
            clearTimer();
            unsubscribe();
        };
    }, [delayMs]);

    return waking;
};
