import { describe, expect, it } from "vitest";
import { isValidReactionEmoji } from "../../src/domain/utils/isValidReactionEmoji.js";

describe("isValidReactionEmoji", () => {
  it("accepts single emoji graphemes", () => {
    expect(isValidReactionEmoji("💙")).toBe(true);
    expect(isValidReactionEmoji("🔥")).toBe(true);
    expect(isValidReactionEmoji("🏳️‍🌈")).toBe(true);
  });

  it("rejects empty, ascii words, multi-grapheme text, and overlong values", () => {
    expect(isValidReactionEmoji("")).toBe(false);
    expect(isValidReactionEmoji("empathy")).toBe(false);
    expect(isValidReactionEmoji("ok")).toBe(false);
    expect(isValidReactionEmoji("https://x")).toBe(false);
    expect(isValidReactionEmoji("💙🔥")).toBe(false);
    expect(isValidReactionEmoji("😀😀😀😀😀😀😀😀😀")).toBe(false);
  });
});
