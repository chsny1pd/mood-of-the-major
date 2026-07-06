import { expect, test } from "@playwright/test";

test.describe("Student journey", () => {
  test("register, create mood, and view in feed", async ({ page }) => {
    const email = `e2e-${Date.now()}@test.local`;
    const password = "TestPass1";
    const moodText = `E2E mood ${Date.now()} — feeling hopeful today.`;

    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Student ID").fill(`E2E${Date.now().toString(36).slice(-8).toUpperCase()}`);
    await page.getByLabel("Year of study").selectOption("2");
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

    await page.goto("/create");
    await page.getByLabel("Your mood").fill(moodText);
    await page.getByRole("button", { name: "Stress" }).click();
    await page.getByRole("button", { name: "Publish anonymously" }).click();

    await expect(page).toHaveURL(/\/mood\//, { timeout: 15_000 });
    await expect(page.getByText(moodText)).toBeVisible();

    await page.goto("/feed");
    await expect(page.getByText(moodText)).toBeVisible({ timeout: 15_000 });
  });

  test("login with existing account", async ({ page }) => {
    const email = `e2e-login-${Date.now()}@test.local`;
    const password = "TestPass1";

    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Student ID").fill(`E2E${Date.now().toString(36).slice(-8).toUpperCase()}`);
    await page.getByLabel("Year of study").selectOption("2");
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible({ timeout: 10_000 });

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/feed/, { timeout: 15_000 });
  });
});
