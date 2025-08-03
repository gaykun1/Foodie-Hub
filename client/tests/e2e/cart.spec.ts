import { test, expect } from '@playwright/test';

test('Login if not and add food to cart and go to order page', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(5000);
    if (page.url().includes("/auth/login")) {
        await page.fill("#label1", "user2");
        await page.fill("#label2", "12345678Bb");

        await page.getByText("Log in").click();
        await page.waitForURL("**/");
    }
    await page.getByTestId("cart").click();

    const cartItems = await page.getByTestId("lessAmount");
    const count = await cartItems.count();
    for (let i = 0; i < count; i++) {
        await cartItems.nth(i).click();

    }
    await page.getByText("View Menu").click();
    const addToCartButton = page.getByText("Add to cart").first();
    await addToCartButton.click();

    const length = page.getByTestId("cartLength");
    await expect(length).toHaveText("1");

    await page.getByTestId("cart").click();
    await page.getByText("Place order").click();
    await page.waitForURL("**/orders/order/*");
    await page.waitForSelector('#selectCountry', { state: 'visible' });
    await page.locator("#selectCountry").selectOption({ value: 'Ukraine' });
    await page.getByLabel("name", { exact: true }).fill("Name");
    await page.getByLabel("surname", { exact: true }).fill("Surname");
    await page.getByLabel("city").fill("Kyiv");
    await page.getByLabel("street").fill("Shevchenko");
    await page.getByLabel("house-number").fill("3");
    await page.getByLabel("express").click();
    await page.waitForTimeout(2000);
    await page.getByLabel("place-order").click();
    await page.waitForSelector('iframe[name^="__privateStripeFrame"]', { timeout: 20000 });

    const stripeIframes = await page.$$('iframe[name^="__privateStripeFrame"]');
    let cardFrame = null;
    for (const iframeElement of stripeIframes) {//getting iframe element where is content
        const frame = await iframeElement.contentFrame();
        if (!frame) continue;
        const cardInputCount = await frame.locator('input[name="cardnumber"]').count();//if cardnumber input exists we continue process 
        if (cardInputCount > 0) {
            cardFrame = frame;
            break;
        }
    }

    if (!cardFrame) {
        return;
    }

   
    await cardFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
    await cardFrame.locator('input[name="exp-date"]').fill('12/34');
    await cardFrame.locator('input[name="cvc"]').fill('123');
});
