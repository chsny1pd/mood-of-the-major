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