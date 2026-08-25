/**
 * Resolves the allowed CORS origin from `CORS_ORIGIN`.
 *
 * The `cors` package treats a falsy `origin` option as "allow any origin" —
 * if `CORS_ORIGIN` is ever unset (a misconfigured deploy, a missing env var),
 * both the REST API (app.ts) and the socket.io server (socket.ts) would
 * silently fail *open*: any site could make credentialed requests. Returning
 * `false` here instead makes a missing env var fail *closed* (no cross-origin
 * access at all) rather than wide open, which is the safe direction for a
 * misconfiguration to fail in.
 */
export const resolveCorsOrigin = (): string | false => process.env.CORS_ORIGIN || false;
