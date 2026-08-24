/**
 * Back-compat barrel. New code should import from the focused modules
 * (`@/api/auth`, `@/api/orders`, ...) or the `@/api` namespace barrel; this
 * file re-exports the handful of helpers that already had call sites.
 */
export { LogIn, SignUp, logOut, getProfile, getRole, updateProfile } from "./auth";
export { getRestaurantsFiltered } from "./restaurants";
