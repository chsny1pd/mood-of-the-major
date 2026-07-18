# Task 5 Review: Migration script (slug → emoji)

**Base:** `63fab07edff242db01bdb0edebed3b863c2cfda0`  
**Head:** `84940413183226936de67ec3ffb567e251d4d732`

## Verdict

- **Spec:** ✅
- **Quality:** Approved

## Findings

### Critical
- None.

### Important
- None.

### Minor
- Unknown legacy slugs are skipped (not remapped); ops must review `reactionsSkipped` and warn logs before deploy.
- Documents with both `reactionType` and `emoji` already set are excluded from reaction migration and may retain a stale `reactionType` field.
- `syncIndexes()` recreates the non-unique `userId_1_targetType_1_targetId_1` lookup index defined in the Task 3 schema after the manual drop — expected; the legacy unique constraint is removed.
- Staging/production require an explicit one-time run; commit message documents this.

## Verdict summary

Task 5 meets the brief: script follows `backfill-approval-status.ts`, remaps reactions and summaries via `LEGACY_REACTION_SLUG_TO_EMOJI`, swaps indexes with post-sync verification, logs counts, and adds the npm script. Local dry-run, typecheck, and lint reported passing.
