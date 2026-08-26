"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Coffee } from "lucide-react";
import { useBackendWaking } from "@/hooks/useBackendWaking";

/**
 * Explains a cold start while it is happening.
 *
 * The API runs on a free tier that suspends the service after a stretch of
 * inactivity: the first request back waits ~50s for the container to boot, then
 * everything is fast. Left unexplained that looks exactly like a broken app —
 * a screen of skeleton placeholders that sits there for a minute. Naming the
 * cause turns it into a known trade-off of the hosting rather than a bug.
 *
 * Rendered once, from Providers, because it reflects a whole-app condition
 * (any request pending too long) rather than any one screen's data.
 *
 * Sits top-centre to stay clear of the toast stack in the bottom-right.
 */
export const ColdStartNotice = () => {
    const waking = useBackendWaking();
    const [mounted, setMounted] = useState(false);

    // Portals need a DOM to target, so nothing renders until after hydration.
    useEffect(() => setMounted(true), []);

    // Gating the portal itself (rather than animating the child out with
    // AnimatePresence) guarantees the node is really gone once the wait ends.
    // An exit animation left this fixed-position overlay mounted at opacity 0,
    // which is invisible but still real DOM sitting over the page.
    if (!mounted || !waking) return null;

    return createPortal(
        <div
            role="status"
            aria-live="polite"
            // Deliberately not animated in. Any entrance that starts from
            // opacity 0 — motion's `initial` or a CSS keyframe — leaves the
            // notice invisible wherever animations are paused rather than run,
            // which is exactly the case that matters: a backgrounded tab, where
            // a cold start is most likely to be waiting. A status message has
            // to be legible the instant it mounts, so it simply appears.
            // pointer-events-none because nothing in it is interactive and it
            // must never intercept a click meant for the page underneath.
            className="pointer-events-none fixed z-[290] top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md"
        >
            <div className="flex items-start gap-3 rounded-lg border border-border bg-surface shadow-elevation3 px-4 py-3">
                <span className="mt-0.5 shrink-0 text-brand">
                    <Coffee size={18} />
                </span>
                <div className="text-sm">
                    <p className="font-semibold text-ink">Waking the server up…</p>
                    <p className="mt-0.5 leading-5 text-inkMuted">
                        The backend sleeps after a while idle on free hosting. This first
                        load can take up to a minute — everything is quick afterwards.
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};
