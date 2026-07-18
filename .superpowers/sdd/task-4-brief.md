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