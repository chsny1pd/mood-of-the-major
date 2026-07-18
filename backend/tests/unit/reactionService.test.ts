import { describe, expect, it, vi } from "vitest";
import { ReactionService } from "../../src/application/services/ReactionService.js";

function makeService(
  overrides: Partial<{
    toggle: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    countUserReactions: ReturnType<typeof vi.fn>;
    findUserReactions: ReturnType<typeof vi.fn>;
    getReactionSummary: ReturnType<typeof vi.fn>;
  }> = {},
) {
  const reactions = {
    toggle: vi.fn(),
    remove: vi.fn(),
    findUserReactions: vi.fn().mockResolvedValue([]),
    countUserReactions: vi.fn().mockResolvedValue(0),
    getReactionSummary: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
  const moods = { isActive: vi.fn().mockResolvedValue(true) };
  const comments = { findById: vi.fn() };

  return {
    service: new ReactionService(reactions as never, moods as never, comments as never),
    reactions,
  };
}

describe("ReactionService.toggleReaction", () => {
  it("rejects invalid emoji", async () => {
    const { service } = makeService();

    await expect(
      service.toggleReaction("u1", {
        targetType: "mood",
        targetId: "m1",
        emoji: "empathy",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("rejects when adding beyond 7 and emoji not already owned", async () => {
    const { service, reactions } = makeService({
      countUserReactions: vi.fn().mockResolvedValue(7),
      findUserReactions: vi.fn().mockResolvedValue(["💙", "🤝", "🫂", "✊", "🔥", "✨", "😂"]),
    });

    await expect(
      service.toggleReaction("u1", {
        targetType: "mood",
        targetId: "m1",
        emoji: "🎉",
      }),
    ).rejects.toMatchObject({ code: "REACTION_LIMIT_REACHED" });
    expect(reactions.toggle).not.toHaveBeenCalled();
  });

  it("allows toggle-off when already at 7", async () => {
    const owned = ["💙", "🤝", "🫂", "✊", "🔥", "✨", "😂"];
    const { service, reactions } = makeService({
      countUserReactions: vi.fn().mockResolvedValue(7),
      findUserReactions: vi.fn().mockResolvedValue(owned),
      toggle: vi.fn().mockResolvedValue({
        emoji: "🔥",
        toggledOn: false,
        reactionSummary: {},
        userReactions: owned.filter((emoji) => emoji !== "🔥"),
      }),
    });

    const result = await service.toggleReaction("u1", {
      targetType: "mood",
      targetId: "m1",
      emoji: "🔥",
    });

    expect(result.toggledOn).toBe(false);
    expect(reactions.toggle).toHaveBeenCalled();
  });
});

describe("ReactionService reaction views", () => {
  it("removes one emoji and returns the repository mutation view", async () => {
    const remove = vi.fn().mockResolvedValue({
      emoji: "💙",
      toggledOn: false,
      reactionSummary: { "🤝": 1 },
      userReactions: ["🤝"],
    });
    const { service } = makeService({ remove });

    const result = await service.removeReaction("u1", "mood", "m1", "💙");

    expect(remove).toHaveBeenCalledWith({
      userId: "u1",
      targetType: "mood",
      targetId: "m1",
      emoji: "💙",
    });
    expect(result).toMatchObject({
      targetType: "mood",
      targetId: "m1",
      emoji: "💙",
      toggledOn: false,
      userReactions: ["🤝"],
    });
  });

  it("returns all reactions owned by the requesting user", async () => {
    const { service } = makeService({
      getReactionSummary: vi.fn().mockResolvedValue({ "💙": 2 }),
      findUserReactions: vi.fn().mockResolvedValue(["💙"]),
    });

    await expect(service.getReactions("mood", "m1", "u1")).resolves.toEqual({
      targetType: "mood",
      targetId: "m1",
      reactionSummary: { "💙": 2 },
      userReactions: ["💙"],
    });
  });
});
