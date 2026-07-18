# Emoji reactions (chat-style) — Design

> **Date:** 2026-07-18  
> **Status:** Approved for planning  
> **Approach:** A — store Unicode emoji as reaction keys (replace slug `reactionType`)

## Problem

Today each authenticated user may set **at most one** reaction per mood or comment. Types are a fixed allowlist (`empathy`, `support`, `relate`, `solidarity`). Users cannot react with multiple emojis or introduce an emoji that only appears on that post/comment.

Desired behavior matches common chat apps (e.g. Discord / iMessage): multiple reactions per user, any Unicode emoji, scoped to that target only, with aggregate counts and no public identity of who reacted.

## Goals

1. Allow up to **7** distinct emoji reactions per user per target (mood or comment).
2. Keep **four default shortcuts** always visible on every target: `💙` `🤝` `🫂` `✊` (former empathy / support / relate / solidarity).
3. Allow any authenticated user to add additional Unicode emojis on that target via a `+` picker; custom emojis appear on that target only when count > 0.
4. Preserve anonymity: public API returns counts and the caller’s own `userReactions` only — never who reacted.

## Non-goals

- Custom sticker uploads or image-based reactions
- Per-reaction author lists or “who reacted” UI
- Admin-managed reaction catalog as a separate product surface (defaults are UI shortcuts only)
- Changing mood/comment card layout beyond the reaction bar
- New MongoDB collections (stay within the existing `reactions` collection; no 16th collection / ADR for storage)

## Data model

### `reactions` collection

| Field | Change |
|-------|--------|
| `reactionType` (slug enum) | **Replace** with `emoji` (string) |
| Unique index | `{ userId, targetType, targetId, emoji }` |
| Cap | At most **7** documents per `(userId, targetType, targetId)` |

Other fields unchanged: `userId`, `targetType` (`mood` \| `comment`), `targetId`, timestamps.

### Denormalized summary

`reactionSummary` on moods and comments becomes a map of **emoji → count**, e.g. `{ "💙": 12, "🔥": 3 }`.

Atomic `$inc` / decrement on toggle remains the write path.

### Migration

One-time mapping of existing slugs:

| Old `reactionType` | New `emoji` |
|--------------------|-------------|
| `empathy` | `💙` |
| `support` | `🤝` |
| `relate` | `🫂` |
| `solidarity` | `✊` |

After remap: drop old unique index `{ userId, targetType, targetId }`, ensure new unique `{ userId, targetType, targetId, emoji }`. Legacy documents that would collide after remap (same user already had only one slug per target) remain valid as a single row each.

## API

### Toggle (primary write path)

- **Endpoint:** `PUT /api/v1/reactions` (auth required)
- **Body:** `{ targetType, targetId, emoji }`
- **Behavior (toggle):**
  - If the user does **not** already have this emoji on the target → insert document and `$inc` summary (add).
  - If the user **already** has this emoji on the target → delete document and decrement summary (remove).
  - If adding and the user already has 7 distinct emojis on the target → `422` `REACTION_LIMIT_REACHED` (no change).
  - Invalid emoji → `422`
  - Missing / inactive target → `404`

### Explicit remove (optional, keep for API completeness)

- **Endpoint:** `DELETE /api/v1/reactions` (auth required)
- **Body:** `{ targetType, targetId, emoji }`
- Removes that emoji for the caller if present; no-op / same summary if absent. Same anonymity rules.

### Read

- **Endpoint:** `GET /api/v1/reactions` (or existing get-by-target)
- **Response shape:**
  - `reactionSummary: Record<string, number>`
  - `userReactions: string[]` (authenticated caller only; empty / omitted for anonymous)
  - Never expose `userId` or other reactors

Breaking change vs current: `reactionType` → `emoji`; `userReaction: string \| null` → `userReactions: string[]`.

## Validation

- `emoji` required string; max length **8** UTF-16 code units (aligned with existing custom emoji input elsewhere).
- Must be a single emoji grapheme (or a small allowlist of ZWJ sequences); reject plain text, URLs, and empty strings.
- `targetType` / `targetId` unchanged rules.

## UI (`ReactionBar`)

Display order:

1. Four defaults always: `💙` `🤝` `🫂` `✊` (show count when > 0).
2. Any other emojis present in `reactionSummary` for this target.
3. `+` button opens an emoji picker (reuse / extend existing `EmojiPicker` patterns: preset grid + optional custom input).

Interaction:

- Highlight chips the user owns (`userReactions`).
- Click owned chip → remove that emoji.
- Click unowned chip or pick from `+` → add (if under limit).
- At 7 reactions: disable `+` and show a short limit message.
- Unauthenticated: disabled controls + login link (current pattern).

Optimistic updates with rollback on error (current `ReactionBar` pattern, extended for arrays).

## Error handling

| Case | Result |
|------|--------|
| Not authenticated | `401` |
| Invalid emoji | `422` |
| Limit 7 reached | `422` `REACTION_LIMIT_REACHED` |
| Target missing / inactive | `404` |

## Testing

- Unit: multi-emoji toggle; cap at 7; summary increment/decrement; emoji validation.
- Integration: auth on PUT/DELETE; request body uses `emoji`; responses include `userReactions`.
- Anonymity / mapper tests updated for emoji-keyed summaries and array `userReactions`.
- Migration: slug → emoji mapping covered by script or test helper.

## Docs to update (implementation phase)

- `docs/api.md` — Reaction APIs
- `docs/database.md` — `reactions` schema and indexes
- `docs/glossary.md` — Reaction definition (one → many; emoji keys)
- `docs/requirements.md` / `OD-007` notes if still describing slug-only defaults

## Out of scope follow-ups

- Admin CRUD for default shortcut set
- Skin-tone variant normalization policy beyond “store as submitted grapheme”
- Soft-delete of reactions (remain hard delete)
