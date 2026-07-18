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