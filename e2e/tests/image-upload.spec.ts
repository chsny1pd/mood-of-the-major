import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { registerStudent } from "../helpers/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testImagePath = path.join(__dirname, "../fixtures/test-image.png");

const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("Image upload", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("https://dev-download.local/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: PNG_BYTES,
      });
    });
  });

  test("uploads image via proxy and publishes mood with attachment", async ({ page }) => {
    const email = `e2e-image-${Date.now()}@test.local`;
    const moodText = `E2E image mood ${Date.now()}`;

    await registerStudent(page, email);

    await page.goto("/create");
    await page.getByLabel("Your mood").fill(moodText);
    await page.getByRole("button", { name: "Stress" }).click();

    await page.locator("#images").setInputFiles(testImagePath);
    await expect(page.locator('img[src^="blob:"]')).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Publish anonymously" }).click();
    await expect(page).toHaveURL(/\/mood\//, { timeout: 15_000 });
    await expect(page.getByText(moodText)).toBeVisible();

    const moodImages = page.locator("article img");
    await expect(moodImages.first()).toBeVisible({ timeout: 15_000 });
  });
});
