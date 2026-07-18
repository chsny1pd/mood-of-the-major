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