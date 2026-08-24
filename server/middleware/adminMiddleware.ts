import { requireRole } from "./authMiddleware";

/**
 * Admin-only surfaces: platform statistics, the courier application queue,
 * and cross-restaurant reporting.
 *
 * Delegates to `requireRole`, which resolves the role from the stored User
 * document rather than the token's claim — see authMiddleware for why.
 */
export const adminMiddleware = requireRole("admin");
