import { describe, expect, it } from "vitest";
import {
  buildDescendingCountCursorOr,
  buildNextCursor,
  decodeCursor,
  encodeCursor,
} from "../../src/utils/cursorPagination.js";

describe("cursorPagination", () => {
  it("encodes and decodes cursor payloads", () => {
    const payload = { createdAt: "2026-07-05T08:00:00.000Z", id: "665a1b2c3d4e5f6789012348" };
    const cursor = encodeCursor(payload);
    const decoded = decodeCursor(cursor);

    expect(decoded).toEqual(payload);
  });

  it("builds next cursor when page is full", () => {
    const items = [
      { id: "2", createdAt: new Date("2026-07-05T09:00:00.000Z") },
      { id: "1", createdAt: new Date("2026-07-05T08:00:00.000Z") },
    ];

    const result = buildNextCursor(items, 2);

    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBeTruthy();
    expect(decodeCursor(result.nextCursor!)).toEqual({
      createdAt: "2026-07-05T08:00:00.000Z",
      id: "1",
    });
  });

  it("includes reactionCount in most_reacted cursors", () => {
    const items = [
      {
        id: "2",
        createdAt: new Date("2026-07-05T09:00:00.000Z"),
        reactionCount: 10,
        commentCount: 1,
      },
      {
        id: "1",
        createdAt: new Date("2026-07-05T08:00:00.000Z"),
        reactionCount: 5,
        commentCount: 3,
      },
    ];

    const result = buildNextCursor(items, 2, "most_reacted");

    expect(decodeCursor(result.nextCursor!)).toEqual({
      createdAt: "2026-07-05T08:00:00.000Z",
      id: "1",
      reactionCount: 5,
    });
  });

  it("includes commentCount in most_commented cursors", () => {
    const items = [
      {
        id: "2",
        createdAt: new Date("2026-07-05T09:00:00.000Z"),
        reactionCount: 1,
        commentCount: 8,
      },
      {
        id: "1",
        createdAt: new Date("2026-07-05T08:00:00.000Z"),
        reactionCount: 4,
        commentCount: 2,
      },
    ];

    const result = buildNextCursor(items, 2, "most_commented");

    expect(decodeCursor(result.nextCursor!)).toEqual({
      createdAt: "2026-07-05T08:00:00.000Z",
      id: "1",
      commentCount: 2,
    });
  });

  it("builds descending count cursor filter clauses", () => {
    const createdAt = new Date("2026-07-05T08:00:00.000Z");

    expect(
      buildDescendingCountCursorOr({
        countField: "reactionCount",
        cursorCount: 5,
        cursorCreatedAt: createdAt,
        cursorId: "abc",
      }),
    ).toEqual([
      { reactionCount: { $lt: 5 } },
      { reactionCount: 5, createdAt: { $lt: createdAt } },
      { reactionCount: 5, createdAt, _id: { $lt: "abc" } },
    ]);
  });

  it("returns null cursor when page is partial", () => {
    const result = buildNextCursor([{ id: "1", createdAt: new Date() }], 20);

    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });
});
