import { describe, expect, it } from "vitest";
import { buildNextCursor, decodeCursor, encodeCursor } from "../../src/utils/cursorPagination.js";

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

  it("returns null cursor when page is partial", () => {
    const result = buildNextCursor([{ id: "1", createdAt: new Date() }], 20);

    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });
});
