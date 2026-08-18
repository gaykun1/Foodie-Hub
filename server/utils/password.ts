// Mirrors the client-side rule (client/src/app/auth/register/page.tsx) — kept
// here too since the client check is trivially bypassed by calling the API directly.
export const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
export const PASSWORD_POLICY_MESSAGE =
    "Password must be at least 8 characters and include a lowercase letter, an uppercase letter, and a number.";
