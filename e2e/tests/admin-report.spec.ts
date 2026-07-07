import { expect, test } from "@playwright/test";
import { createMoodWithTag, E2E_ADMIN, loginUser, registerStudent } from "../helpers/auth.js";

test.describe("Admin report flow", () => {
  test("admin dismisses a pending report from the queue", async ({ page, browser }) => {
    const authorEmail = `e2e-author-${Date.now()}@test.local`;
    const reporterEmail = `e2e-reporter-${Date.now()}@test.local`;
    const moodText = `Report target ${Date.now()}`;

    await registerStudent(page, authorEmail);
    await createMoodWithTag(page, moodText);

    const reporterContext = await browser.newContext();
    const reporterPage = await reporterContext.newPage();
    await registerStudent(reporterPage, reporterEmail);
    await reporterPage.goto("/feed");
    await reporterPage.getByText(moodText).click();
    await expect(reporterPage).toHaveURL(/\/mood\//);
    await reporterPage.getByTestId("report-mood-button").click();
    await expect(reporterPage.getByTestId("report-modal")).toBeVisible();
    await reporterPage.getByTestId("report-submit-button").click();
    await expect(reporterPage.getByText(/report has been received/i)).toBeVisible({
      timeout: 10_000,
    });
    await reporterContext.close();

    await loginUser(page, E2E_ADMIN.email, E2E_ADMIN.password);
    await page.goto("/admin/reports");
    await expect(page.getByRole("heading", { name: "Report queue" })).toBeVisible();
    await expect(page.getByText(moodText)).toBeVisible({ timeout: 10_000 });

    const reportRow = page.locator("li").filter({ hasText: moodText });
    await reportRow.getByRole("button", { name: "Dismiss" }).click();
    await expect(reportRow).toHaveCount(0, { timeout: 15_000 });
  });
});
