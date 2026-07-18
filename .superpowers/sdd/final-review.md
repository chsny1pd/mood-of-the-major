# Final Code Review — `feat/emoji-reactions`

> **Reviewer:** Senior Code Reviewer (read-only)
> **Date:** 2026-07-18
> **Range:** `d28f046` (plan commit) → `36a733d` (HEAD)
> **Spec:** `docs/superpowers/specs/2026-07-18-emoji-reactions-design.md`
> **Plan:** `docs/superpowers/plans/2026-07-18-emoji-reactions.md`

## Verdict: **Ready to merge** (minors only; none blocking)

The branch implements the approved design faithfully. Chat-style multi-emoji reactions
(max 7 per user per target), always-visible defaults `💙 🤝 🫂 ✊`, free Unicode via a `+`
picker, `PUT` toggle semantics, and preserved anonymity are all present and covered by tests.
No Critical or Important defects were found. All findings are Minor and consistent with the
carried-minor ledger; none introduce correctness, security, or anonymity risk.

---

## Spec conformance

| Requirement | Status | Evidence |
|---|---|---|
| Up to 7 distinct emoji per user per target | ✅ | `ReactionService.toggleReaction` pre-check (`count >= MAX_REACTIONS_PER_USER`) + repo post-create rollback; `MAX_REACTIONS_PER_USER = 7` |
| Defaults always visible (`💙🤝🫂✊`) | ✅ | `DEFAULT_REACTION_EMOJIS` in `types/engagement.ts`; `ReactionBar` renders defaults unconditionally |
| Free Unicode via `+` picker, scoped to target | ✅ | `ReactionEmojiPicker` (grid + custom input); extras filtered to `> 0` |
| `PUT /reactions` toggles | ✅ | Controller `toggle`, repo `toggle` insert/delete + `$inc`/decrement |
| `DELETE /reactions` with `emoji` | ✅ | `removeReactionSchema` requires `emoji`; controller forwards `body.emoji` |
| Anonymity — counts + caller `userReactions` only | ✅ | `findUserReactions` selects `emoji` only; `getReactions` returns `[]` for anonymous; mapper/anonymity tests updated |
| Breaking rename `reactionType`→`emoji`, `userReaction`→`userReactions[]` | ✅ | Domain, ports, schemas, controller, FE types/service all switched; source grep clean |
| Emoji validation (max 8, single grapheme, reject text/URLs) | ✅ (see Minor 2) | `isValidReactionEmoji` shared helper + Zod `max(EMOJI_MAX_LENGTH)` |
| Migration slug→emoji + index swap + summary remap | ✅ | `migrate-reaction-emojis.ts`; drops `userId_1_targetType_1_targetId_1`, ensures unique `..._emoji_1` |
| No new collection | ✅ | Stays in `reactions` |
| Docs updated (`api.md`, `database.md`, `glossary.md`, `requirements.md`) | ✅ (see Minor 6) | All four updated; `OD-007` moved to resolved |

Error contract matches spec: `401` / `404` / `422 VALIDATION_FAILED` / `422 REACTION_LIMIT_REACHED`
(uses `AppError`, not `ValidationError`, so the code is preserved — as called out in the plan self-review).

---

## Findings

### Critical (0)
None.

### Important (0)
None.

### Minor (7)

1. **Zero-count keys retained in `reactionSummary`.** Toggle-off does `$inc: -1` with no
   `$unset` cleanup (`MongooseReactionRepository.adjustTargetSummary`), so removed emojis linger
   as `0` entries and are returned in API responses. The plan marked cleanup **optional**, and the
   frontend filters non-defaults by `> 0` (`ReactionBar` `extraEmojis`) and `MoodCard` sums numerics,
   so behavior is correct. Cosmetic/storage growth only. Non-blocking.

2. **Emoji validation is looser than "must be a single emoji."** `isValidReactionEmoji` rejects
   ASCII-only strings then requires a single grapheme, but accepts any single **non-ASCII** grapheme
   (e.g. a CJK character or a lone `♥`). This exactly matches the regex the approved plan specified
   (Task 1), so it conforms to plan while being slightly looser than the spec wording. Low risk
   (no anonymity/count impact). Non-blocking; consider a tighter emoji-property check as follow-up.

3. **7-limit is not DB-atomic (carried minor).** Enforced by a service count-check plus a
   best-effort repo post-create rollback (`count > MAX` → delete + reverse `$inc`). Two concurrent
   adds for the same user/target can both roll back, spuriously rejecting a legitimate add. No data
   corruption (summary stays consistent); self-corrects on retry. Matches ledger "concurrent limit
   not DB-atomic."

4. **Integration success-path coverage gap (carried minor).** `engagement.test.ts` adds `401`
   auth guards for PUT/DELETE but no authenticated toggle-on/off or limit-reached integration test.
   Unit coverage (service + repo rollback) compensates. Matches ledger.

5. **Browser smoke not performed (carried minor).** Picker positioning / feed + detail interaction
   verified only via RTL unit tests, not a live browser. Matches Task 7 ledger.

6. **Stale singular `userReaction` in secondary docs (carried minor).** `docs/authentication.md`
   (L442), `docs/testing-strategy.md` (L449), and `docs/adr.md` (L841) still describe `userReaction`
   (singular). Primary contract docs (`api.md`, `database.md`, `glossary.md`, `requirements.md`) are
   correct. Matches Task 8 ledger. Doc-only.

7. **Duplicated FE validation.** `ReactionEmojiPicker` reimplements `isValidReactionEmoji` with a
   hardcoded `8` instead of importing a shared constant. Acceptable BE/FE boundary; minor drift risk.

---

## Carried-minors triage

**None block merge.** All carried minors (integration success coverage, non-atomic concurrent
limit, browser smoke, stale secondary-doc `userReaction`, database catalog wording) are
quality/coverage/documentation items with no correctness, security, or anonymity impact. Track as
fast-follow tickets. The previously-noted database catalog row (`reactions` "one reaction per user
per target") **has** been corrected to "Up to 7 distinct emoji per user per target."

## Recommended (optional) follow-ups
- Add `$unset` cleanup (or filter zero keys on read) to keep summaries tidy (Minor 1).
- Add an authenticated integration test covering toggle-on/off and `REACTION_LIMIT_REACHED` (Minor 4).
- Sync `authentication.md` / `testing-strategy.md` / `adr.md` to `userReactions[]` (Minor 6).
- Consider Unicode emoji-property validation and a shared FE/BE validator (Minors 2, 7).
