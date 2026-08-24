import { requireRole } from "./authMiddleware";

/**
 * Shared management surfaces reachable from both the owner's dashboard and
 * the admin's per-restaurant view.
 *
 * Delegates to `requireRole`, which resolves the role from the stored User
 * document rather than the token's claim — see authMiddleware for why.
 */
export const dashboardMiddleware = requireRole("restaurant", "admin");
