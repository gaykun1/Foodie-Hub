import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
    testDir: './tests/e2e',
    // The journey stubs the API at the network layer, so it needs no database,
    // no Stripe keys and no seeded data — it can therefore run on every push.
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    workers: isCI ? 1 : undefined,
    reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
    timeout: 60_000,
    expect: { timeout: 10_000 },
    use: {
        baseURL: 'http://localhost:3000',
        headless: true,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        // A production build in CI: it is what actually ships, and it removes
        // the first-request compile pauses that make dev-mode runs flaky.
        command: isCI ? 'npm run build && npm run start' : 'npm run dev',
        port: 3000,
        reuseExistingServer: !isCI,
        timeout: 180_000,
        env: {
            // The stub matches on path, so any absolute base URL works — this
            // just guarantees one is defined when CI has no .env.local.
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000',
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
                process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_placeholder',
        },
    },
});
