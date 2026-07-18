### Task 1: Emoji validation helper + constants

**Files:**
- Create: `backend/src/domain/utils/isValidReactionEmoji.ts`
- Create: `backend/tests/unit/isValidReactionEmoji.test.ts`
- Modify: `backend/src/domain/constants/engagementConstants.ts`

**Interfaces:**
- Produces: `isValidReactionEmoji(value: string): boolean`
- Produces: `DEFAULT_REACTION_EMOJIS`, `MAX_REACTIONS_PER_USER`, `EMOJI_MAX_LENGTH`, `LEGACY_REACTION_SLUG_TO_EMOJI`
- Produces: remove or stop exporting slug `REACTION_TYPES` / `ReactionType` (replace with emoji constants)

- [ ] **Step 1: Write failing tests**

```ts
// backend/tests/unit/isValidReactionEmoji.test.ts
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
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && npm test -- tests/unit/isValidReactionEmoji.test.ts
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implement helper + constants**

```ts
// backend/src/domain/utils/isValidReactionEmoji.ts
import { EMOJI_MAX_LENGTH } from "../constants/engagementConstants.js";

export function isValidReactionEmoji(value: string): boolean {
  const emoji = value.trim();
  if (!emoji || emoji.length > EMOJI_MAX_LENGTH) return false;
  if (/^[a-zA-Z0-9_\-\s./:]+$/.test(emoji)) return false;
  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
  const graphemes = [...segmenter.segment(emoji)];
  return graphemes.length === 1;
}
```

```ts
// engagementConstants.ts — replace REACTION_TYPES block with:
export const DEFAULT_REACTION_EMOJIS = ["💙", "🤝", "🫂", "✊"] as const;
export type DefaultReactionEmoji = (typeof DEFAULT_REACTION_EMOJIS)[number];

export const MAX_REACTIONS_PER_USER = 7;
export const EMOJI_MAX_LENGTH = 8;

export const LEGACY_REACTION_SLUG_TO_EMOJI = {
  empathy: "💙",
  support: "🤝",
  relate: "🫂",
  solidarity: "✊",
} as const;
```

Keep `COMMENT_*`, `REPORT_*`, search limits unchanged. Remove `REACTION_TYPES` / `ReactionType` exports; fix compile errors in later tasks (or temporarily re-export aliases only if needed mid-task — prefer fixing callers in Task 2–4).

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd backend && npm test -- tests/unit/isValidReactionEmoji.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/domain/utils/isValidReactionEmoji.ts backend/tests/unit/isValidReactionEmoji.test.ts backend/src/domain/constants/engagementConstants.ts
git commit -m "feat(reactions): add emoji validation and default reaction constants"
```

---