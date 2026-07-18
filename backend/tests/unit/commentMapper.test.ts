import { describe, expect, it } from "vitest";
import {
  assertNoCommentIdentityFields,
  toAnonymousCommentDto,
} from "../../src/application/mappers/commentMapper.js";
import type { Comment } from "../../src/domain/entities/Comment.js";

const sampleComment: Comment = {
  id: "665a1b2c3d4e5f6789012352",
  moodId: "665a1b2c3d4e5f6789012348",
  authorId: "665a1b2c3d4e5f6789012301",
  parentId: null,
  content: "You're not alone in this.",
  status: "active",
  reactionSummary: { "🤝": 3 },
  depth: 0,
  createdAt: new Date("2026-07-05T09:00:00.000Z"),
  updatedAt: new Date("2026-07-05T09:00:00.000Z"),
  deletedAt: null,
};

describe("commentMapper", () => {
  it("maps to anonymous comment DTO without identity fields", () => {
    const dto = toAnonymousCommentDto(sampleComment);

    expect(dto).toEqual({
      id: sampleComment.id,
      content: sampleComment.content,
      parentId: null,
      depth: 0,
      reactionSummary: { "🤝": 3 },
      createdAt: "2026-07-05T09:00:00.000Z",
    });

    expect(JSON.stringify(dto)).not.toContain("authorId");
    assertNoCommentIdentityFields(dto);
  });
});
