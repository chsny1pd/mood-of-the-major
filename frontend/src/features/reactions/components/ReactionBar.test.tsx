import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../../../lib/i18n";
import type { ReactionView } from "../../../types/engagement";
import { ReactionBar } from "./ReactionBar";

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock("../../../services/reactionService", () => ({
  fetchReactions: vi.fn(),
  toggleReaction: vi.fn(),
}));

import { fetchReactions, toggleReaction } from "../../../services/reactionService";

const mockFetchReactions = vi.mocked(fetchReactions);
const mockToggleReaction = vi.mocked(toggleReaction);

function renderReactionBar(data: ReactionView) {
  mockFetchReactions.mockResolvedValue(data);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return {
    queryClient,
    ...screen,
    renderResult: (
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <QueryClientProvider client={queryClient}>
            <ReactionBar targetType="mood" targetId="mood-1" />
          </QueryClientProvider>
        </MemoryRouter>
      </I18nextProvider>
    ),
  };
}

async function mountReactionBar(data: ReactionView) {
  const setup = renderReactionBar(data);
  render(setup.renderResult);
  await screen.findByTitle("Empathy");
  return setup;
}

const baseData: ReactionView = {
  targetType: "mood",
  targetId: "mood-1",
  reactionSummary: {},
  userReactions: [],
};

describe("ReactionBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("always renders the default reaction chips", async () => {
    await mountReactionBar(baseData);

    for (const emoji of ["💙", "🤝", "🫂", "✊"]) {
      expect(screen.getByRole("button", { name: emoji })).toBeInTheDocument();
    }
  });

  it("marks an owned reaction chip active", async () => {
    await mountReactionBar({
      ...baseData,
      reactionSummary: { "💙": 2 },
      userReactions: ["💙"],
    });

    expect(screen.getByRole("button", { name: "💙2" })).toHaveAttribute("aria-pressed", "true");
  });

  it("disables the add button at the reaction limit", async () => {
    await mountReactionBar({
      ...baseData,
      userReactions: ["💙", "🤝", "🫂", "✊", "😀", "🥳", "🌟"],
    });

    expect(screen.getByRole("button", { name: "Add reaction" })).toBeDisabled();
  });

  it("keeps the picker open and does not toggle invalid custom input", async () => {
    await mountReactionBar(baseData);
    fireEvent.click(screen.getByRole("button", { name: "Add reaction" }));
    const dialog = screen.getByRole("dialog", { name: "Add reaction" });

    fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "hello" } });
    fireEvent.submit(within(dialog).getByRole("textbox").closest("form")!);

    expect(screen.getByRole("dialog", { name: "Add reaction" })).toBeInTheDocument();
    expect(screen.getByText("Enter one emoji (up to 8 characters)")).toBeInTheDocument();
    expect(mockToggleReaction).not.toHaveBeenCalled();
  });

  it("closes on Escape and restores focus to the add button", async () => {
    await mountReactionBar(baseData);
    const addButton = screen.getByRole("button", { name: "Add reaction" });
    fireEvent.click(addButton);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "Add reaction" })).not.toBeInTheDocument();
    expect(addButton).toHaveFocus();
  });

  it("closes on an outside click and restores focus", async () => {
    await mountReactionBar(baseData);
    const addButton = screen.getByRole("button", { name: "Add reaction" });
    fireEvent.click(addButton);

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole("dialog", { name: "Add reaction" })).not.toBeInTheDocument();
    expect(addButton).toHaveFocus();
  });

  it("shows a mutation error", async () => {
    mockToggleReaction.mockRejectedValue(new Error("network"));
    await mountReactionBar(baseData);

    fireEvent.click(screen.getByRole("button", { name: "💙" }));

    await waitFor(() => {
      expect(screen.getByText("Could not update reaction")).toBeInTheDocument();
    });
  });
});
