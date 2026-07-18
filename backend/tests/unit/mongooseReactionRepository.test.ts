import { beforeEach, describe, expect, it, vi } from "vitest";

const modelMocks = vi.hoisted(() => ({
  reaction: {
    findOne: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn(),
    find: vi.fn(),
  },
  mood: {
    findOneAndUpdate: vi.fn(),
  },
  comment: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock("../../src/infrastructure/database/models/Reaction.js", () => ({
  ReactionModel: modelMocks.reaction,
}));
vi.mock("../../src/infrastructure/database/models/Mood.js", () => ({
  MoodModel: modelMocks.mood,
}));
vi.mock("../../src/infrastructure/database/models/Comment.js", () => ({
  CommentModel: modelMocks.comment,
}));

import { MongooseReactionRepository } from "../../src/infrastructure/database/repositories/MongooseReactionRepository.js";

describe("MongooseReactionRepository.toggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rolls back a created reaction and summary when the user exceeds the limit", async () => {
    const created = { deleteOne: vi.fn().mockResolvedValue(undefined) };
    modelMocks.reaction.findOne.mockResolvedValue(null);
    modelMocks.reaction.create.mockResolvedValue(created);
    modelMocks.reaction.countDocuments.mockResolvedValue(8);
    modelMocks.reaction.find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ emoji: "🎉" }]),
      }),
    });
    modelMocks.mood.findOneAndUpdate
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue({ reactionSummary: { "🎉": 1 } }),
      })
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue({ reactionSummary: { "🎉": 0 } }),
      });

    const repository = new MongooseReactionRepository();

    await expect(
      repository.toggle({
        userId: "u1",
        targetType: "mood",
        targetId: "m1",
        emoji: "🎉",
      }),
    ).rejects.toMatchObject({ code: "REACTION_LIMIT_REACHED" });
    expect(created.deleteOne).toHaveBeenCalledOnce();
    expect(modelMocks.mood.findOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      { _id: "m1" },
      expect.objectContaining({
        $inc: { "reactionSummary.🎉": -1, reactionCount: -1 },
        $set: { lastActivityAt: expect.any(Date) },
      }),
      { new: true },
    );
  });
});
