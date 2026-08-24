import { requireRole } from "./authMiddleware";

/**
 * Courier-only surfaces. Proves the caller is *a* courier; handlers still
 * resolve which courier from the authenticated user.
 *
 * Delegates to `requireRole`, which resolves the role from the stored User
 * document rather than the token's claim — see authMiddleware for why.
 */
export const courierMiddleware = requireRole("courier");
