import { expect, test } from "@playwright/test";

test.describe("Public smoke", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /share how you feel/i })).toBeVisible();
  });

  test("feed page loads without authentication", async ({ page }) => {
    await page.goto("/feed");
    await expect(page).toHaveURL(/\/feed/);
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });
});
