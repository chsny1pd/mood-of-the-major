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