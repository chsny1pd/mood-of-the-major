export const E2E_ADMIN = {
  email: "e2e-admin@test.local",
  password: "TestPass1",
};

export async function registerStudent(
  page: import("@playwright/test").Page,
  email: string,
  password = "TestPass1",
): Promise<void> {
  const studentId = `E2E${Date.now().toString(36).slice(-8).toUpperCase()}`;
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Student ID").fill(studentId);
  await page.getByLabel("Year of study").selectOption("2");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/feed/, { timeout: 15_000 });
}

export async function loginUser(
  page: import("@playwright/test").Page,
  email: string,
  password = "TestPass1",
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/feed/, { timeout: 15_000 });
}

export async function createMoodWithTag(
  page: import("@playwright/test").Page,
  content: string,
): Promise<void> {
  await page.goto("/create");
  await page.getByLabel("Your mood").fill(content);
  await page.getByRole("button", { name: "Stress" }).click();
  await page.getByRole("button", { name: "Publish anonymously" }).click();
  await page.waitForURL(/\/mood\//, { timeout: 15_000 });
}
