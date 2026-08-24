import { requireRole } from "./authMiddleware";

/**
 * Restaurant-account surfaces. Ownership of a specific restaurant is checked
 * inside the handlers, since an admin manages any of them.
 *
 * Delegates to `requireRole`, which resolves the role from the stored User
 * document rather than the token's claim — see authMiddleware for why.
 */
export const restaurantMiddleware = requireRole("restaurant");
