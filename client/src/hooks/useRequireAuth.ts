"use client";
import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppSelector } from "@/hooks/reduxHooks";

/**
 * Gate for *actions* rather than pages — adding to cart is public, but
 * checking out, favouriting a restaurant or applying to be a courier are not.
 *
 * `ensureAuth(run)` invokes `run` when the visitor is signed in, and otherwise
 * sends them to login with a `next` param so they return to exactly where they
 * were. It returns `true` when the action ran, so callers can bail out early.
 */
export const useRequireAuth = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { status, isAuthenticated } = useAppSelector((state) => state.auth);

  const promptLogin = useCallback(() => {
    router.push(`/auth/login?next=${encodeURIComponent(pathname || "/")}`);
  }, [router, pathname]);

  const ensureAuth = useCallback(
    (run: () => void): boolean => {
      // Still resolving the session — do nothing rather than bounce a visitor
      // who is in fact signed in.
      if (status === "loading") return false;
      if (!isAuthenticated) {
        promptLogin();
        return false;
      }
      run();
      return true;
    },
    [status, isAuthenticated, promptLogin]
  );

  return { ensureAuth, promptLogin, isAuthenticated, isResolving: status === "loading" };
};
