import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingPage } from "../pages/LandingPage";
import { renderWithProviders } from "../test/renderWithProviders";

describe("LandingPage", () => {
  it("renders the hero headline", () => {
    renderWithProviders(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        name: /share how you feel/i,
      }),
    ).toBeInTheDocument();
  });
});
