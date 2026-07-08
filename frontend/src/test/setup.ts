import "@testing-library/jest-dom/vitest";
import { beforeAll, expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";
import { ensureFullTranslations } from "../lib/i18n";

expect.extend(toHaveNoViolations);

beforeAll(async () => {
  await ensureFullTranslations();
});
