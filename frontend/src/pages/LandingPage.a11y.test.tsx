import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { LandingPage } from "../pages/LandingPage";
import { renderWithProviders } from "../test/renderWithProviders";

describe("LandingPage accessibility", () => {
  it("has no detectable a11y violations", async () => {
    const { container } = renderWithProviders(<LandingPage />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
