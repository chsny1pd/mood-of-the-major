import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { MoodCard } from "./MoodCard";
import type { AnonymousMood } from "../types/mood";

const sampleMood: AnonymousMood = {
  id: "mood-1",
  content: "Feeling good about the project today.",
  faculty: { id: "f1", name: "Engineering", slug: "engineering" },
  major: null,
  tags: [{ id: "t1", slug: "joy", name: "Joy", isPrimary: true }],
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
    render(
      <MemoryRouter>
        <MoodCard mood={sampleMood} />
      </MemoryRouter>,
    );

    expect(screen.getByText(sampleMood.content)).toBeInTheDocument();
    expect(screen.getByText("Joy")).toBeInTheDocument();
    expect(screen.getByText("3 comments")).toBeInTheDocument();
    expect(screen.queryByText(/author/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /avatar/i })).not.toBeInTheDocument();
  });
});
