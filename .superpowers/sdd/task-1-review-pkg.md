# Review package Task 1
BASE: d28f04696d4649af6d78362f669e7eff841ae411
HEAD: 26fa365d34d40733614b8735482223c27efe5adf

## Commits
26fa365 feat(reactions): add emoji validation and default reaction constants

## Stat
 backend/src/domain/constants/engagementConstants.ts | 14 ++++++++++++--
 backend/src/domain/utils/isValidReactionEmoji.ts    | 10 ++++++++++
 backend/tests/unit/isValidReactionEmoji.test.ts     | 19 +++++++++++++++++++
 3 files changed, 41 insertions(+), 2 deletions(-)

## Diff
diff --git a/backend/src/domain/constants/engagementConstants.ts b/backend/src/domain/constants/engagementConstants.ts
index 805f62b..4a9c2f6 100644
--- a/backend/src/domain/constants/engagementConstants.ts
+++ b/backend/src/domain/constants/engagementConstants.ts
@@ -1,16 +1,26 @@
 export const COMMENT_CONTENT_MIN_LENGTH = 1;
 export const COMMENT_CONTENT_MAX_LENGTH = 2000;
 export const COMMENT_MAX_THREAD_DEPTH = 3;
 
-export const REACTION_TYPES = ["empathy", "support", "relate", "solidarity"] as const;
-export type ReactionType = (typeof REACTION_TYPES)[number];
+export const DEFAULT_REACTION_EMOJIS = ["≡ƒÆÖ", "≡ƒñ¥", "≡ƒ½é", "Γ£è"] as const;
+export type DefaultReactionEmoji = (typeof DEFAULT_REACTION_EMOJIS)[number];
+
+export const MAX_REACTIONS_PER_USER = 7;
+export const EMOJI_MAX_LENGTH = 8;
+
+export const LEGACY_REACTION_SLUG_TO_EMOJI = {
+  empathy: "≡ƒÆÖ",
+  support: "≡ƒñ¥",
+  relate: "≡ƒ½é",
+  solidarity: "Γ£è",
+} as const;
 
 export const REPORT_REASON_CODES = [
   "harassment",
   "spam",
   "self_harm",
   "hate_speech",
   "other",
 ] as const;
 export type ReportReasonCode = (typeof REPORT_REASON_CODES)[number];
 
diff --git a/backend/src/domain/utils/isValidReactionEmoji.ts b/backend/src/domain/utils/isValidReactionEmoji.ts
new file mode 100644
index 0000000..37fc704
--- /dev/null
+++ b/backend/src/domain/utils/isValidReactionEmoji.ts
@@ -0,0 +1,10 @@
+import { EMOJI_MAX_LENGTH } from "../constants/engagementConstants.js";
+
+export function isValidReactionEmoji(value: string): boolean {
+  const emoji = value.trim();
+  if (!emoji || emoji.length > EMOJI_MAX_LENGTH) return false;
+  if (/^[a-zA-Z0-9_\-\s./:]+$/.test(emoji)) return false;
+  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
+  const graphemes = [...segmenter.segment(emoji)];
+  return graphemes.length === 1;
+}
diff --git a/backend/tests/unit/isValidReactionEmoji.test.ts b/backend/tests/unit/isValidReactionEmoji.test.ts
new file mode 100644
index 0000000..4ee7dea
--- /dev/null
+++ b/backend/tests/unit/isValidReactionEmoji.test.ts
@@ -0,0 +1,19 @@
+import { describe, expect, it } from "vitest";
+import { isValidReactionEmoji } from "../../src/domain/utils/isValidReactionEmoji.js";
+
+describe("isValidReactionEmoji", () => {
+  it("accepts single emoji graphemes", () => {
+    expect(isValidReactionEmoji("≡ƒÆÖ")).toBe(true);
+    expect(isValidReactionEmoji("≡ƒöÑ")).toBe(true);
+    expect(isValidReactionEmoji("≡ƒÅ│∩╕ÅΓÇì≡ƒîê")).toBe(true);
+  });
+
+  it("rejects empty, ascii words, multi-grapheme text, and overlong values", () => {
+    expect(isValidReactionEmoji("")).toBe(false);
+    expect(isValidReactionEmoji("empathy")).toBe(false);
+    expect(isValidReactionEmoji("ok")).toBe(false);
+    expect(isValidReactionEmoji("https://x")).toBe(false);
+    expect(isValidReactionEmoji("≡ƒÆÖ≡ƒöÑ")).toBe(false);
+    expect(isValidReactionEmoji("≡ƒÿÇ≡ƒÿÇ≡ƒÿÇ≡ƒÿÇ≡ƒÿÇ≡ƒÿÇ≡ƒÿÇ≡ƒÿÇ≡ƒÿÇ")).toBe(false);
+  });
+});

