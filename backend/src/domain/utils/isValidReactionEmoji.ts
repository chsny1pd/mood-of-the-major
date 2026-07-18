import { EMOJI_MAX_LENGTH } from "../constants/engagementConstants.js";

export function isValidReactionEmoji(value: string): boolean {
  const emoji = value.trim();
  if (!emoji || emoji.length > EMOJI_MAX_LENGTH) return false;
  if (/^[a-zA-Z0-9_\-\s./:]+$/.test(emoji)) return false;
  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
  const graphemes = [...segmenter.segment(emoji)];
  return graphemes.length === 1;
}
