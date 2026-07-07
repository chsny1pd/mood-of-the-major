import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { MoodCard } from "./MoodCard";
import { renderWithProviders } from "../test/renderWithProviders";
import type { AnonymousMood } from "../types/mood";

const sampleMood: AnonymousMood = {
  id: "mood-1",
  content: "Feeling good about the project today.",
  faculty: { id: "f1", name: "Engineering", nameTh: null, slug: "engineering" },
  major: null,
  tags: [{ id: "t1", slug: "joy", name: "Joy", nameTh: null, isPrimary: true }],
  commentCount: 3,
  reactionSummary: { empathy: 2, support: 1 },
  imageCount: 0,
  images: [],
  createdAt: new Date().toISOString(),
  lastActivityAt: new Date().toISOString(),
  editedAt: null,
};

describe("MoodCard", () => {
  it("renders mood content without author identity", () => {
    renderWithProviders(<MoodCard mood={sampleMood} />);

    expect(screen.getByText(sampleMood.content)).toBeInTheDocument();
    expect(screen.getByText("Joy")).toBeInTheDocument();
    expect(screen.getByText("3 comments")).toBeInTheDocument();
    expect(screen.queryByText(/author/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /avatar/i })).not.toBeInTheDocument();
  });
});
