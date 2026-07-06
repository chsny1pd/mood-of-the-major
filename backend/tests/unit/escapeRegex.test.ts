import { describe, expect, it } from "vitest";
import { escapeRegex } from "../../src/utils/escapeRegex.js";

describe("escapeRegex", () => {
  it("escapes regex special characters", () => {
    expect(escapeRegex("hello (world)")).toBe("hello \\(world\\)");
    expect(escapeRegex("test.query*")).toBe("test\\.query\\*");
  });
});
