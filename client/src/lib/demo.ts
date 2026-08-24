/**
 * Public-demo constants.
 *
 * These describe the accounts created by `server/scripts/seed.ts`. They are
 * deliberately non-secret: the seeded data is disposable and the deployment
 * only surfaces them when NEXT_PUBLIC_DEMO_MODE is "true".
 */

export const isDemoMode = (): boolean => process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export interface DemoAccount {
  label: string;
  username: string;
  password: string;
  description: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    label: "Customer",
    username: "demo",
    password: "DemoPass123",
    description: "Browse, order, track and rate — the main journey.",
  },
  {
    label: "Restaurant owner",
    username: "demo-restaurant",
    password: "DemoPass123",
    description: "Accept incoming orders and manage a menu.",
  },
  {
    label: "Courier",
    username: "demo-courier",
    password: "DemoPass123",
    description: "Pick up deliveries and push live location updates.",
  },
  {
    label: "Admin",
    username: "demo-admin",
    password: "DemoPass123",
    description: "Platform-wide statistics and courier applications.",
  },
];

/**
 * Stripe's universally-accepted test card. Any future expiry, any CVC and any
 * postcode are accepted alongside it.
 */
export const STRIPE_TEST_CARD = {
  number: "4242 4242 4242 4242",
  expiry: "any future date",
  cvc: "any 3 digits",
  postcode: "any",
} as const;
