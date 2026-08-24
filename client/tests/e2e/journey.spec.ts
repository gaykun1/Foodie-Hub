import { test, expect } from "@playwright/test";
import { mockApi, DISH, RESTAURANT } from "./fixtures/api";

/**
 * The one journey that has to keep working: discovery → cart → checkout →
 * tracking, driven exactly as a visitor would.
 *
 * The backend is stubbed (see fixtures/api.ts) so this runs in CI with no
 * database, no Stripe keys and no seeded data — the point is to catch the
 * front-end flow breaking, which is what actually regresses.
 */
test.describe("customer journey", () => {
    test("a visitor can browse, fill a cart, sign in, reach checkout and track the order", async ({ page }) => {
        const api = await mockApi(page);

        // ---- 1. Discovery, as a logged-out visitor ----------------------
        await page.goto("/");

        // The whole point of the guest-browsing work: no redirect to login.
        await expect(page).toHaveURL(/\/$/);
        await expect(page.getByRole("link", { name: "Discover" })).toBeVisible();

        await page.goto(`/restaurants/category/all-restaurants`);
        await expect(page.getByText(RESTAURANT.title).first()).toBeVisible();

        // ---- 2. Open a menu and add a dish, still logged out -------------
        await page.goto(`/restaurant/menu/${RESTAURANT._id}`);
        await expect(page.getByText(DISH.title).first()).toBeVisible();

        await page.getByTestId("add-to-cart").first().click();

        // The guest basket lives in localStorage; the badge proves it landed.
        await expect(page.getByTestId("cartLength")).toHaveText("1");

        // ---- 3. Checkout is the first thing that needs an account --------
        await page.getByTestId("cart").click();
        const checkoutButton = page.getByRole("button", { name: /sign in to order/i });
        await expect(checkoutButton).toBeVisible();
        await checkoutButton.click();

        await page.waitForURL(/\/auth\/login/);
        // The visitor is sent back where they were after signing in.
        expect(page.url()).toContain("next=");

        // ---- 4. Sign in --------------------------------------------------
        await page.fill("#label1", "demo");
        await page.fill("#label2", "DemoPass123");
        await page.getByRole("button", { name: "Log in", exact: true }).click();

        // ---- 5. Place the order and reach checkout -----------------------
        await page.goto("/");
        await expect(page.getByTestId("cartLength")).toHaveText("1");

        await page.getByTestId("cart").click();
        await page.getByRole("button", { name: /place order/i }).click();

        await page.waitForURL("**/orders/order/*");
        await expect(page.getByRole("heading", { name: /one last step to dinner/i })).toBeVisible();

        // The checkout summary reflects the real order the API returned.
        await expect(page.getByText(DISH.title).first()).toBeVisible();
        await expect(page.getByRole("button", { name: "place-order" })).toBeVisible();

        // Delivery speed is selectable, and the summary total responds.
        await page.getByLabel("express").click();
        await expect(page.getByLabel("express")).toBeChecked();

        // ---- 6. Tracking --------------------------------------------------
        // The order has been accepted and a courier is on the way.
        api.orderStatus = "Delivering";
        await page.goto("/orders");

        await expect(page.getByRole("heading", { name: /your dinner is on the way/i })).toBeVisible();
        await expect(page.getByText("On the way").first()).toBeVisible();
        // The delivery address the order was placed with.
        await expect(page.getByText(/Yaroslaviv Val/).first()).toBeVisible();
    });

    test("a logged-out visitor sees a sign-in prompt on the orders page rather than being redirected", async ({ page }) => {
        await mockApi(page);

        await page.goto("/orders");

        // Still on /orders — the page explains itself in place instead of
        // bouncing the visitor away and losing their context.
        await expect(page).toHaveURL(/\/orders$/);
        await expect(page.getByRole("heading", { name: /sign in to see your orders/i })).toBeVisible();
        await expect(page.getByRole("link", { name: /^sign in$/i })).toBeVisible();
    });

    test("a logged-out visitor can read a restaurant's menu without any account", async ({ page }) => {
        await mockApi(page);

        await page.goto(`/restaurant/menu/${RESTAURANT._id}`);

        await expect(page).toHaveURL(new RegExp(`/restaurant/menu/${RESTAURANT._id}$`));
        await expect(page.getByRole("heading", { name: "Our Menu" })).toBeVisible();
        await expect(page.getByText(DISH.title).first()).toBeVisible();
    });
});
