import { describe, expect, it } from "vitest";
import { buildMoodFeedSort } from "../../src/infrastructure/database/repositories/MongooseMoodRepository.js";

describe("buildMoodFeedSort", () => {
  it("sorts most_reacted by reactionCount descending", () => {
    expect(buildMoodFeedSort({ sort: "most_reacted", limit: 20 })).toEqual({
      reactionCount: -1,
      createdAt: -1,
      _id: -1,
    });
  });

  it("sorts most_commented by commentCount descending", () => {
    expect(buildMoodFeedSort({ sort: "most_commented", limit: 20 })).toEqual({
      commentCount: -1,
      createdAt: -1,
      _id: -1,
    });
  });

  it("defaults to newest by createdAt", () => {
    expect(buildMoodFeedSort({ limit: 20 })).toEqual({
      createdAt: -1,
      _id: -1,
    });
  });
});
