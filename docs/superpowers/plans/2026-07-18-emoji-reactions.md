# Chat-style emoji reactions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace single slug reactions with multi-emoji (max 7 per user per target), keep four default shortcuts always visible, and let anyone add Unicode emojis scoped to that mood/comment.

**Architecture:** Store one `reactions` document per `(userId, targetType, targetId, emoji)`. `PUT /reactions` toggles that emoji. Denormalized `reactionSummary` maps emoji → count. Defaults `💙🤝🫂✊` are UI shortcuts only. Preserve anonymity (`userReactions` for caller only).

**Tech Stack:** Express, Zod, Mongoose, React 19, TanStack Query, Vitest, existing `EmojiPicker` / `EMOTION_EMOJI_OPTIONS`

**Spec:** [`docs/superpowers/specs/2026-07-18-emoji-reactions-design.md`](../specs/2026-07-18-emoji-reactions-design.md)

## Global Constraints

- Max **7** distinct emojis per user per target
- Defaults always shown: `💙` `🤝` `🫂` `✊`
- `emoji` max length **8**; single grapheme; reject ascii-only text / URLs
- Public API never exposes who reacted
- No new MongoDB collection
- Breaking: `reactionType` → `emoji`; `userReaction` → `userReactions: string[]`
- Conventional Commits; update `docs/api.md`, `docs/database.md`, `docs/glossary.md` when behavior ships
- TDD: failing test before production code for each behavior change

## File map

| File | Role |
|------|------|
| `backend/src/domain/constants/engagementConstants.ts` | Default emojis, max count, legacy slug map; drop slug `REACTION_TYPES` enum |
| `backend/src/domain/utils/isValidReactionEmoji.ts` | Shared emoji validation |
| `backend/src/domain/entities/Reaction.ts` | `emoji` field; remove inputs |
| `backend/src/domain/ports/IReactionRepository.ts` | Toggle/list user emojis |
| `backend/src/infrastructure/database/models/Reaction.ts` | Schema + unique index |
| `backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts` | Toggle, count, remove-by-emoji |
| `backend/src/application/services/ReactionService.ts` | Toggle + limit + validation |
| `backend/src/validators/engagementSchemas.ts` | Zod `emoji` body |
| `backend/src/controllers/reactionController.ts` | Pass `emoji` on remove |
| `backend/scripts/migrate-reaction-emojis.ts` | Slug → emoji + index swap + summary remap |
| `frontend/src/types/engagement.ts` | Defaults + `userReactions` |
| `frontend/src/services/reactionService.ts` | API client |
| `frontend/src/features/reactions/components/ReactionBar.tsx` | Multi + `+` picker |
| `frontend/src/components/MoodCard.tsx` | Sum all summary values |
| `docs/api.md`, `docs/database.md`, `docs/glossary.md` | Contract docs |

---

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

### Task 2: Domain entity + repository port

**Files:**
- Modify: `backend/src/domain/entities/Reaction.ts`
- Modify: `backend/src/domain/ports/IReactionRepository.ts`
- Test: covered by Task 3 service/repo tests (this task is type-level; compile must stay intentional)

**Interfaces:**
- Produces:

```ts
export interface Reaction {
  id: string;
  userId: string;
  targetType: ReactionTargetType;
  targetId: string;
  emoji: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToggleReactionInput {
  userId: string;
  targetType: ReactionTargetType;
  targetId: string;
  emoji: string;
}

export interface RemoveReactionInput {
  userId: string;
  targetType: ReactionTargetType;
  targetId: string;
  emoji: string;
}

export interface ReactionMutationResult {
  emoji: string | null;
  toggledOn: boolean;
  reactionSummary: Record<string, number>;
  userReactions: string[];
}

export interface IReactionRepository {
  toggle(input: ToggleReactionInput): Promise<ReactionMutationResult>;
  remove(input: RemoveReactionInput): Promise<ReactionMutationResult>;
  findUserReactions(
    userId: string,
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<string[]>;
  countUserReactions(
    userId: string,
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<number>;
  getReactionSummary(
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<Record<string, number>>;
}
```

- [ ] **Step 1: Rewrite entity + port files** as above (delete `UpsertReactionInput`, `findUserReaction`, slug types).

- [ ] **Step 2: Confirm TypeScript errors are only in consumers** (repo/service/validators) — expected; fixed in Tasks 3–4.

```bash
cd backend && npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/domain/entities/Reaction.ts backend/src/domain/ports/IReactionRepository.ts
git commit -m "refactor(reactions): switch domain types from slug to emoji"
```

---

### Task 3: Mongoose model + repository (toggle, multi, limit helpers)

**Files:**
- Modify: `backend/src/infrastructure/database/models/Reaction.ts`
- Modify: `backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts`
- Create: `backend/tests/unit/reactionRepositoryToggle.test.ts` (pure logic extract optional) **or** unit-test `ReactionService` with mock repo in Task 4 — **prefer Task 4 mock service tests**; this task implements repo + model.

**Interfaces:**
- Consumes: `ToggleReactionInput`, `RemoveReactionInput`, `ReactionMutationResult`
- Produces: working `MongooseReactionRepository.toggle` / `remove` / `findUserReactions` / `countUserReactions`

- [ ] **Step 1: Update Reaction model**

```ts
const reactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, required: true, enum: ["mood", "comment"] },
    targetId: { type: Schema.Types.ObjectId, required: true },
    emoji: { type: String, required: true, maxlength: 8 },
  },
  { timestamps: true, collection: "reactions" },
);

reactionSchema.index(
  { userId: 1, targetType: 1, targetId: 1, emoji: 1 },
  { unique: true },
);
reactionSchema.index({ targetType: 1, targetId: 1 });
reactionSchema.index({ userId: 1, targetType: 1, targetId: 1 });
```

Do **not** keep enum on emoji. Drop old unique `{ userId, targetType, targetId }` from schema definition (migration script drops it in DB in Task 5).

- [ ] **Step 2: Rewrite repository**

Behavior for `toggle`:
1. `findOne({ userId, targetType, targetId, emoji })`
2. If exists → delete, `$inc` summary emoji by -1 (clamp cleanup: if count ≤ 0, `$unset` that key optional), return `{ toggledOn: false, emoji, reactionSummary, userReactions }`
3. If not exists → `countDocuments` for user+target; if `>= MAX_REACTIONS_PER_USER` throw or return signal — **prefer throw from service**; repo can throw `ValidationError`/`AppError` **or** return a discriminated result. **Chosen:** repo assumes service already checked limit; service checks `countUserReactions` before create. Repo `toggle` still deletes if present without counting.
4. Create + `$inc` +1
5. Always return fresh `userReactions` via `findUserReactions`

`adjustTargetSummary` must use emoji string as map key (same `$inc` pattern; Mongo accepts unicode keys).

`remove` requires `emoji` in filter; same decrement path.

- [ ] **Step 3: Commit**

```bash
git add backend/src/infrastructure/database/models/Reaction.ts backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts
git commit -m "feat(reactions): persist multi-emoji reactions in mongoose"
```

---

### Task 4: ReactionService + Zod + controller + routes

**Files:**
- Modify: `backend/src/application/services/ReactionService.ts`
- Modify: `backend/src/validators/engagementSchemas.ts`
- Modify: `backend/src/controllers/reactionController.ts`
- Modify: `backend/src/routes/reactionRoutes.ts` (if needed)
- Create: `backend/tests/unit/reactionService.test.ts`
- Modify: `backend/tests/integration/engagement.test.ts`
- Fix any DI / mapper compile breaks

**Interfaces:**
- Consumes: `IReactionRepository.toggle`, `isValidReactionEmoji`, `MAX_REACTIONS_PER_USER`
- Produces:

```ts
async toggleReaction(userId: string, input: { targetType; targetId; emoji: string }): Promise<{
  targetType;
  targetId;
  emoji: string | null;
  toggledOn: boolean;
  reactionSummary: Record<string, number>;
  userReactions: string[];
}>

async removeReaction(userId, targetType, targetId, emoji): Promise<{...}>

async getReactions(...): Promise<{
  targetType; targetId;
  reactionSummary: Record<string, number>;
  userReactions: string[];
}>
```

- [ ] **Step 1: Write failing unit tests** (mock `IReactionRepository`, moods, comments)

```ts
import { describe, expect, it, vi } from "vitest";
import { ReactionService } from "../../src/application/services/ReactionService.js";
import { AppError } from "../../src/domain/errors/AppError.js";

function makeService(overrides: Partial<{
  toggle: ReturnType<typeof vi.fn>;
  countUserReactions: ReturnType<typeof vi.fn>;
  findUserReactions: ReturnType<typeof vi.fn>;
}> = {}) {
  const reactions = {
    toggle: vi.fn(),
    remove: vi.fn(),
    findUserReactions: vi.fn().mockResolvedValue([]),
    countUserReactions: vi.fn().mockResolvedValue(0),
    getReactionSummary: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
  const moods = { isActive: vi.fn().mockResolvedValue(true) };
  const comments = { findById: vi.fn() };
  return {
    service: new ReactionService(reactions as never, moods as never, comments as never),
    reactions,
  };
}

describe("ReactionService.toggleReaction", () => {
  it("rejects invalid emoji", async () => {
    const { service } = makeService();
    await expect(
      service.toggleReaction("u1", { targetType: "mood", targetId: "m1", emoji: "empathy" }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("rejects when adding beyond 7 and emoji not already owned", async () => {
    const { service, reactions } = makeService({
      countUserReactions: vi.fn().mockResolvedValue(7),
      findUserReactions: vi.fn().mockResolvedValue(["💙", "🤝", "🫂", "✊", "🔥", "✨", "😂"]),
    });
    await expect(
      service.toggleReaction("u1", { targetType: "mood", targetId: "m1", emoji: "🎉" }),
    ).rejects.toMatchObject({ code: "REACTION_LIMIT_REACHED" });
    expect(reactions.toggle).not.toHaveBeenCalled();
  });

  it("allows toggle-off when already at 7", async () => {
    const owned = ["💙", "🤝", "🫂", "✊", "🔥", "✨", "😂"];
    const { service, reactions } = makeService({
      countUserReactions: vi.fn().mockResolvedValue(7),
      findUserReactions: vi.fn().mockResolvedValue(owned),
      toggle: vi.fn().mockResolvedValue({
        emoji: "🔥",
        toggledOn: false,
        reactionSummary: {},
        userReactions: owned.filter((e) => e !== "🔥"),
      }),
    });
    const result = await service.toggleReaction("u1", {
      targetType: "mood",
      targetId: "m1",
      emoji: "🔥",
    });
    expect(result.toggledOn).toBe(false);
    expect(reactions.toggle).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd backend && npm test -- tests/unit/reactionService.test.ts
```

- [ ] **Step 3: Implement service**

```ts
async toggleReaction(userId: string, input: { targetType; targetId; emoji: string }) {
  const emoji = input.emoji.trim();
  if (!isValidReactionEmoji(emoji)) {
    throw new ValidationError("Invalid reaction emoji", [
      { field: "emoji", message: "Must be a single emoji." },
    ]);
  }
  await this.assertTargetExists(input.targetType, input.targetId);

  const existing = await this.reactions.findUserReactions(userId, input.targetType, input.targetId);
  const alreadyHas = existing.includes(emoji);
  if (!alreadyHas) {
    const count = existing.length; // or countUserReactions
    if (count >= MAX_REACTIONS_PER_USER) {
      throw new AppError("Reaction limit reached", {
        statusCode: 422,
        code: "REACTION_LIMIT_REACHED",
      });
    }
  }

  const result = await this.reactions.toggle({
    userId,
    targetType: input.targetType,
    targetId: input.targetId,
    emoji,
  });

  return {
    targetType: input.targetType,
    targetId: input.targetId,
    ...result,
  };
}
```

Rename controller `upsert` handler to call `toggleReaction`. Update Zod:

```ts
export const upsertReactionSchema = z.object({
  targetType: z.enum(["mood", "comment"]),
  targetId: z.string().min(1),
  emoji: z.string().trim().min(1).max(EMOJI_MAX_LENGTH),
});

export const removeReactionSchema = z.object({
  targetType: z.enum(["mood", "comment"]),
  targetId: z.string().min(1),
  emoji: z.string().trim().min(1).max(EMOJI_MAX_LENGTH),
});
```

Controller remove must pass `body.emoji`.

Integration test body:

```ts
.put("/api/v1/reactions").send({
  targetType: "mood",
  targetId: "665a1b2c3d4e5f6789012348",
  emoji: "💙",
});
```

- [ ] **Step 4: Run unit + integration auth tests — expect PASS**

```bash
cd backend && npm test -- tests/unit/reactionService.test.ts tests/integration/engagement.test.ts
```

- [ ] **Step 5: Fix anonymity / mapper unit tests** that still expect slug keys or `userReaction` (`anonymityContract.test.ts`, `moodMapper.test.ts`, `commentMapper.test.ts`) — use emoji keys in fixtures.

- [ ] **Step 6: Commit**

```bash
git add backend/src/application/services/ReactionService.ts backend/src/validators/engagementSchemas.ts backend/src/controllers/reactionController.ts backend/tests/unit/reactionService.test.ts backend/tests/integration/engagement.test.ts backend/tests/unit/anonymityContract.test.ts backend/tests/unit/moodMapper.test.ts backend/tests/unit/commentMapper.test.ts
git commit -m "feat(reactions): toggle multi-emoji reactions via API"
```

---

### Task 5: Migration script (slug → emoji)

**Files:**
- Create: `backend/scripts/migrate-reaction-emojis.ts`
- Optional: add npm script `"migrate:reaction-emojis": "tsx scripts/migrate-reaction-emojis.ts"`

**Interfaces:**
- Consumes: `LEGACY_REACTION_SLUG_TO_EMOJI`
- Produces: DB documents with `emoji`; summaries remapped; indexes swapped

- [ ] **Step 1: Implement script** (pattern like `backfill-approval-status.ts`)

Steps inside script:
1. Connect Mongo
2. For each reaction with `reactionType` and no `emoji`: `$set: { emoji: map[slug] }`, `$unset: { reactionType: "" }`
3. For each mood/comment `reactionSummary`: remap keys empathy→💙 etc.; `$set` new summary
4. Drop index `userId_1_targetType_1_targetId_1` if present
5. Ensure unique `userId_1_targetType_1_targetId_1_emoji_1`
6. Log counts; disconnect

```ts
import { LEGACY_REACTION_SLUG_TO_EMOJI } from "../src/domain/constants/engagementConstants.js";

function remapSummary(summary: Record<string, number>): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [key, count] of Object.entries(summary ?? {})) {
    const emoji =
      LEGACY_REACTION_SLUG_TO_EMOJI[key as keyof typeof LEGACY_REACTION_SLUG_TO_EMOJI] ?? key;
    next[emoji] = (next[emoji] ?? 0) + count;
  }
  return next;
}
```

- [ ] **Step 2: Dry-run locally if DB available** (document in commit message that ops must run script per env)

```bash
cd backend && npx tsx scripts/migrate-reaction-emojis.ts
```

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/migrate-reaction-emojis.ts backend/package.json
git commit -m "chore(reactions): add migration from slug reactions to emoji"
```

---

### Task 6: Frontend types + reactionService + MoodCard totals

**Files:**
- Modify: `frontend/src/types/engagement.ts`
- Modify: `frontend/src/services/reactionService.ts`
- Modify: `frontend/src/components/MoodCard.tsx`
- Update i18n keys if labels still keyed by slug — map defaults by emoji or keep translation keys under `engagement.reactions.empathy` etc. via a small map

**Interfaces:**
- Produces:

```ts
export const DEFAULT_REACTION_EMOJIS = [
  { emoji: "💙", translationKey: "engagement.reactions.empathy" },
  { emoji: "🤝", translationKey: "engagement.reactions.support" },
  { emoji: "🫂", translationKey: "engagement.reactions.relate" },
  { emoji: "✊", translationKey: "engagement.reactions.solidarity" },
] as const;

export interface ReactionView {
  targetType: "mood" | "comment";
  targetId: string;
  reactionSummary: Record<string, number>;
  userReactions: string[];
}

export async function toggleReaction(
  targetType: "mood" | "comment",
  targetId: string,
  emoji: string,
): Promise<ReactionView>

export async function removeReaction(
  targetType: "mood" | "comment",
  targetId: string,
  emoji: string,
): Promise<ReactionView>
```

- [ ] **Step 1: Update types + service** to send `{ emoji }` and map response `userReactions` (fallback `[]` if missing).

- [ ] **Step 2: Fix MoodCard**

```ts
const totalReactions = Object.values(mood.reactionSummary ?? {}).reduce(
  (sum, n) => sum + (typeof n === "number" ? n : 0),
  0,
);
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/engagement.ts frontend/src/services/reactionService.ts frontend/src/components/MoodCard.tsx
git commit -m "feat(reactions): update frontend types and API client for emoji reactions"
```

---

### Task 7: ReactionBar UI (multi + picker)

**Files:**
- Modify: `frontend/src/features/reactions/components/ReactionBar.tsx`
- Optionally create: `frontend/src/features/reactions/components/ReactionEmojiPicker.tsx` (popover wrapping preset grid + custom input; reuse `EMOTION_EMOJI_OPTIONS` from `frontend/src/lib/emotionEmoji.ts` plus defaults)
- i18n: add `engagement.reactionLimit` / `engagement.addReaction` strings in existing locale files

**Interfaces:**
- Consumes: `toggleReaction`, `ReactionView.userReactions`, `DEFAULT_REACTION_EMOJIS`
- Produces: chat-style bar per spec §2

- [ ] **Step 1: Rewrite ReactionBar behavior**

Display list:
1. Always render four defaults
2. Then `Object.keys(reactionSummary).filter(e => !defaults.includes(e) && (summary[e] ?? 0) > 0)`
3. `+` button opens picker

Click chip:
- `mutation.mutate(emoji)` → always `toggleReaction` (server toggles)
- Optimistic: if `userReactions.includes(emoji)` remove from array and dec summary; else if `userReactions.length < 7` add and inc; else no-op / show limit toast

At `userReactions.length >= 7` and emoji not owned: disable `+` and unowned non-default adds; show `t("engagement.reactionLimit")`.

Unauthenticated: keep login link pattern.

Picker: compact popover/dropdown (not full-page). Include defaults + `EMOTION_EMOJI_OPTIONS` + single-char custom input (max 8), on pick call toggle and close.

- [ ] **Step 2: Manual smoke** — open feed/mood detail, react multiple emojis, add custom, hit limit 7, logout state.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/reactions/ frontend/src/locales/ # or wherever i18n JSON lives
git commit -m "feat(reactions): chat-style multi-emoji reaction bar"
```

---

### Task 8: Docs sync

**Files:**
- Modify: `docs/api.md` (Reaction APIs section — `emoji`, `userReactions`, `REACTION_LIMIT_REACHED`)
- Modify: `docs/database.md` (`reactions` fields + indexes)
- Modify: `docs/glossary.md` (Reaction definition)
- Modify: `docs/requirements.md` OD-007 note if still “slug-only”

- [ ] **Step 1: Update docs to match shipped API** (no TBD).

- [ ] **Step 2: Commit**

```bash
git add docs/api.md docs/database.md docs/glossary.md docs/requirements.md
git commit -m "docs: document multi-emoji reaction contract"
```

---

### Task 9: Full verification

- [ ] **Step 1: Run backend tests**

```bash
cd backend && npm test
```

Expected: all pass

- [ ] **Step 2: Run frontend typecheck / tests if present**

```bash
cd frontend && npm run typecheck
```

(or `npx tsc --noEmit` / project’s equivalent script)

- [ ] **Step 3: Grep for leftover slug API**

```bash
rg "reactionType|userReaction[^s]|REACTION_TYPES" backend/src frontend/src
```

Expected: only legacy migration map / translation key paths / comments

- [ ] **Step 4: Final commit only if fixes needed**; otherwise done.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Multi emoji per user | 3, 4, 7 |
| Max 7 | 4, 7 |
| Defaults always visible | 7 |
| Free Unicode emoji via `+` | 7 |
| Anonymity | 4 (response shape) |
| `PUT` toggle | 4 |
| `DELETE` with emoji | 4 |
| Migration slug→emoji | 5 |
| Validation | 1, 4 |
| Docs | 8 |
| No new collection | all |

## Plan self-review notes

- Toggle vs DELETE: both specified; UI uses PUT toggle primarily.
- `REACTION_LIMIT_REACHED` uses `AppError` (not `ValidationError`) so code is not overwritten to `VALIDATION_FAILED`.
- MoodCard total must sum all summary values (Task 6) — required after emoji keys.
- Index drop happens in migration script; new schema definition alone does not remove old Atlas/local indexes.
