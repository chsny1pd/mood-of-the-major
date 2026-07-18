# Task 2 Report: Domain entity + repository port

## Status
**DONE**

## Commits
- `008c902` refactor(reactions): switch domain types from slug to emoji

## Test Summary
No new tests (type-level task per brief). `npx tsc --noEmit` reports errors only in expected consumers — not in the two domain files modified here.

## Changes
| File | Action |
|------|--------|
| `backend/src/domain/entities/Reaction.ts` | Modified |
| `backend/src/domain/ports/IReactionRepository.ts` | Modified |

### Entity (`Reaction.ts`)
- `reactionType: ReactionType` → `emoji: string`
- Removed `UpsertReactionInput`; added `ToggleReactionInput` (with `emoji`)
- `RemoveReactionInput` now includes `emoji`
- Added `ReactionMutationResult` (`emoji`, `toggledOn`, `reactionSummary`, `userReactions`)
- Removed import of `ReactionType` from constants

### Port (`IReactionRepository.ts`)
- `upsert` → `toggle(ToggleReactionInput)`
- `remove` returns `ReactionMutationResult` (requires `emoji` in input)
- `findUserReaction` → `findUserReactions` (returns `string[]`)
- Added `countUserReactions`
- Removed `ReactionUpsertResult` and `ReactionType` imports

## TypeScript Compile Check
`cd backend && npx tsc --noEmit` — 15 errors, all in consumers (expected):

| Area | Files | Nature |
|------|-------|--------|
| Service | `ReactionService.ts` | `REACTION_TYPES`/`ReactionType` gone; `upsert`/`findUserReaction` removed; `remove` missing `emoji` |
| Repo | `MongooseReactionRepository.ts` | Old imports (`UpsertReactionInput`, `ReactionUpsertResult`); class missing `toggle`, `findUserReactions`, `countUserReactions` |
| Validators | `engagementSchemas.ts` | Still uses `REACTION_TYPES` |
| Model | `infrastructure/database/models/Reaction.ts` | Still uses `REACTION_TYPES` |
| DI | `config/di.ts` | Mongoose repo no longer satisfies port |
| Seed | `scripts/seed-mock-data.ts` | Still uses `REACTION_TYPES` |

Domain files compile cleanly in isolation; fixes deferred to Tasks 3–4 per brief.

## Self-Review
- Interfaces match task brief verbatim.
- Scope limited to entity + port; no mongoose repo or service changes.
- `ReactionMutationResult` placed in entity file (with input types); port imports it — consistent grouping.

## Concerns
- None for this task. Downstream breakage is intentional and documented for Tasks 3–4.

## Report Path
`C:\Users\pd680\mood-of-the-major\.superpowers\sdd\task-2-report.md`
