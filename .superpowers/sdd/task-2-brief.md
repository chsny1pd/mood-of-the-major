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