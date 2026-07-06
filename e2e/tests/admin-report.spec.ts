import { expect, test } from "@playwright/test";
import { createMoodWithTag, E2E_ADMIN, loginUser, registerStudent } from "../helpers/auth.js";

test.describe("Admin report flow", () => {
  test("admin dismisses a pending report from the queue", async ({ page, context }) => {
    const authorEmail = `e2e-author-${Date.now()}@test.local`;
    const reporterEmail = `e2e-reporter-${Date.now()}@test.local`;
    const moodText = `Report target ${Date.now()}`;

    await registerStudent(page, authorEmail);
    await createMoodWithTag(page, moodText);

    const reporterPage = await context.newPage();
    await registerStudent(reporterPage, reporterEmail);
    await reporterPage.goto("/feed");
    await reporterPage.getByText(moodText).click();
    await reporterPage.getByRole("button", { name: "Report" }).click();
    await reporterPage.getByRole("button", { name: "Submit report" }).click();
    await expect(reporterPage.getByText(/report has been received/i)).toBeVisible({
      timeout: 10_000,
    });
    await reporterPage.close();

    await loginUser(page, E2E_ADMIN.email, E2E_ADMIN.password);
    await page.goto("/admin/reports");
    await expect(page.getByRole("heading", { name: "Report queue" })).toBeVisible();
    await expect(page.getByText(moodText)).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Dismiss" }).first().click();
    await expect(page.getByText("Queue is clear")).toBeVisible({ timeout: 15_000 });
  });
});
