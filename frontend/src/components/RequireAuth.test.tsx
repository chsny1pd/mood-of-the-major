import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import { RequireAuth } from "./RequireAuth";
import { ROUTES } from "../constants/routes";
import i18n from "../lib/i18n";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../hooks/useAuth";

const authMockBase = {
  profileMeta: { displayName: null, avatarUrl: null },
  login: vi.fn(),
  loginWithOAuth: vi.fn(),
  completeOAuthCallback: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshProfile: vi.fn(),
};

describe("RequireAuth", () => {
  it("redirects unauthenticated users to login", () => {
    vi.mocked(useAuth).mockReturnValue({
      ...authMockBase,
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/create"]}>
          <Routes>
            <Route
              path="/create"
              element={
                <RequireAuth>
                  <div>Protected content</div>
                </RequireAuth>
              }
            />
            <Route path={ROUTES.login} element={<div>Login page</div>} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    );

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      ...authMockBase,
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: "u1",
        email: "test@example.com",
        studentId: "6512345678",
        yearOfStudy: 2,
        role: "student",
        facultyId: null,
        majorId: null,
        faculty: null,
        major: null,
        createdAt: new Date().toISOString(),
      },
    });

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <RequireAuth>
            <div>Protected content</div>
          </RequireAuth>
        </MemoryRouter>
      </I18nextProvider>,
    );

    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
