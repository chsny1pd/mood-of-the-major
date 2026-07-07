import { describe, expect, it } from "vitest";
import { assertNoIdentityFields, toAnonymousMoodDto } from "../../src/application/mappers/moodMapper.js";
import type { MoodWithRelations } from "../../src/domain/ports/IMoodRepository.js";

const sampleMood: MoodWithRelations = {
  id: "665a1b2c3d4e5f6789012348",
  authorId: "665a1b2c3d4e5f6789012340",
  content: "Feeling overwhelmed with finals week...",
  facultyId: "665a1b2c3d4e5f6789012345",
  majorId: "665a1b2c3d4e5f6789012346",
  status: "active",
  commentCount: 5,
  reactionSummary: { empathy: 12, support: 8 },
  imageCount: 1,
  primaryTagId: "665a1b2c3d4e5f6789012349",
  reportCount: 0,
  lastActivityAt: new Date("2026-07-05T10:30:00.000Z"),
  editedAt: null,
  createdAt: new Date("2026-07-05T08:00:00.000Z"),
  updatedAt: new Date("2026-07-05T08:00:00.000Z"),
  deletedAt: null,
  tags: [{ tagId: "665a1b2c3d4e5f6789012349", isPrimary: true }],
  faculty: { id: "665a1b2c3d4e5f6789012345", name: "Engineering", nameTh: null, slug: "engineering" },
  major: { id: "665a1b2c3d4e5f6789012346", name: "Computer Science", nameTh: null, slug: "computer-science" },
  tagDetails: [
    { id: "665a1b2c3d4e5f6789012349", slug: "stress", name: "Stress", nameTh: null, isPrimary: true },
  ],
  images: [{ id: "665a1b2c3d4e5f6789012350", sortOrder: 0 }],
};

describe("moodMapper", () => {
  it("strips author identity from public mood DTO", () => {
    const dto = toAnonymousMoodDto(sampleMood);

    expect(dto).not.toHaveProperty("authorId");
    expect(dto).not.toHaveProperty("userId");
    expect(dto).not.toHaveProperty("email");
    expect(dto.id).toBe(sampleMood.id);
    expect(dto.content).toBe(sampleMood.content);
    expect(dto.tags[0]?.slug).toBe("stress");
    assertNoIdentityFields(dto);
  });
});
