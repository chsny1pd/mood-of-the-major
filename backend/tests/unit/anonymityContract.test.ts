import { describe, expect, it } from "vitest";
import {
  assertNoCommentIdentityFields,
  toAnonymousCommentDto,
} from "../../src/application/mappers/commentMapper.js";
import {
  assertNoIdentityFields,
  toAnonymousMoodDto,
} from "../../src/application/mappers/moodMapper.js";
import type { Comment } from "../../src/domain/entities/Comment.js";
import type { MoodWithRelations } from "../../src/domain/ports/IMoodRepository.js";

const IDENTITY_FIELDS = ["authorId", "userId", "email", "uploadedBy"] as const;

function expectNoIdentityKeys(value: unknown): void {
  const serialized = JSON.stringify(value);

  for (const field of IDENTITY_FIELDS) {
    expect(serialized).not.toContain(`"${field}"`);
  }
}

const sampleMood: MoodWithRelations = {
  id: "665a1b2c3d4e5f6789012348",
  authorId: "665a1b2c3d4e5f6789012340",
  content: "Feeling overwhelmed with finals week...",
  facultyId: "665a1b2c3d4e5f6789012345",
  majorId: "665a1b2c3d4e5f6789012346",
  groupId: null,
  status: "active",
  commentCount: 5,
  reactionSummary: { "💙": 12, "🤝": 8 },
  imageCount: 1,
  primaryTagId: "665a1b2c3d4e5f6789012349",
  reportCount: 0,
  lastActivityAt: new Date("2026-07-05T10:30:00.000Z"),
  editedAt: null,
  createdAt: new Date("2026-07-05T08:00:00.000Z"),
  updatedAt: new Date("2026-07-05T08:00:00.000Z"),
  deletedAt: null,
  tags: [{ tagId: "665a1b2c3d4e5f6789012349", isPrimary: true }],
  repostOfMoodId: null,
  repostCount: 0,
  repostOf: null,
  faculty: { id: "665a1b2c3d4e5f6789012345", name: "Engineering", nameTh: null, slug: "engineering" },
  major: { id: "665a1b2c3d4e5f6789012346", name: "Computer Science", nameTh: null, slug: "computer-science" },
  tagDetails: [
    { id: "665a1b2c3d4e5f6789012349", slug: "stress", name: "Stress", nameTh: null, iconKey: "😫", isPrimary: true },
  ],
  images: [{ id: "665a1b2c3d4e5f6789012350", sortOrder: 0 }],
};

const sampleComment: Comment = {
  id: "665a1b2c3d4e5f6789012351",
  moodId: sampleMood.id,
  authorId: "665a1b2c3d4e5f6789012340",
  parentId: null,
  content: "You are not alone.",
  depth: 0,
  status: "active",
  reactionSummary: { "💙": 2 },
  createdAt: new Date("2026-07-05T09:00:00.000Z"),
  updatedAt: new Date("2026-07-05T09:00:00.000Z"),
  deletedAt: null,
};

describe("Public DTO anonymity contract", () => {
  it("mood DTO excludes all identity fields", () => {
    const dto = toAnonymousMoodDto(sampleMood);
    expectNoIdentityKeys(dto);
    assertNoIdentityFields(dto);
  });

  it("comment DTO excludes all identity fields", () => {
    const dto = toAnonymousCommentDto(sampleComment);
    expectNoIdentityKeys(dto);
    assertNoCommentIdentityFields(dto);
  });

  it("comment DTO with isOwner still excludes author identity", () => {
    const dto = toAnonymousCommentDto(sampleComment, { isOwner: true });
    expectNoIdentityKeys(dto);
    expect(dto.isOwner).toBe(true);
  });

  it("mood DTO with isOwner still excludes author identity", () => {
    const dto = toAnonymousMoodDto(sampleMood, { isOwner: true, canEdit: true });
    expectNoIdentityKeys(dto);
    expect(dto.isOwner).toBe(true);
    expect(dto.canEdit).toBe(true);
  });
});
