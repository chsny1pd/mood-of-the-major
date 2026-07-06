import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LandingPage } from "../pages/LandingPage";

describe("LandingPage", () => {
  it("renders the hero headline", () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: /share how you feel/i,
      }),
    ).toBeInTheDocument();
  });
});
