BASE 42fd9d644739f1dc8f341226355db15d13383b5d
HEAD 68e376f30a3aa4ea77dfabfeed81c653bbcc1ac1

68e376f fix(reactions): harden reaction picker validation and close behavior
9677aca feat(reactions): chat-style multi-emoji reaction bar
 .superpowers/sdd/task-7-report.md                  |  37 +++++
 frontend/src/components/EmojiPicker.tsx            |   4 +-
 .../reactions/components/ReactionBar.test.tsx      | 136 +++++++++++++++++++
 .../features/reactions/components/ReactionBar.tsx  |  51 +++++--
 .../reactions/components/ReactionEmojiPicker.tsx   | 150 +++++++++++++++++++++
 frontend/src/locales/en/translation.json           |   4 +
 frontend/src/locales/th/translation.json           |   4 +
 7 files changed, 375 insertions(+), 11 deletions(-)
diff --git a/.superpowers/sdd/task-7-report.md b/.superpowers/sdd/task-7-report.md
new file mode 100644
index 0000000..b0f043c
--- /dev/null
+++ b/.superpowers/sdd/task-7-report.md
@@ -0,0 +1,37 @@
+# Task 7 Report: ReactionBar UI (multi + picker)
+
+## Status
+**DONE**
+
+## Commits
+- `9677aca` feat(reactions): chat-style multi-emoji reaction bar
+
+## Changes
+- ReactionBar always renders the four default shortcuts, followed by non-default summary emojis with positive counts.
+- Added optimistic multi-reaction toggling with owned-chip highlighting, rollback, and a seven-reaction UI guard.
+- Added a compact picker containing the defaults, `EMOTION_EMOJI_OPTIONS`, and an eight-code-unit custom input.
+- Added authenticated limit messaging, disabled unauthenticated controls with the existing login link, dark-theme styles, and English/Thai i18n strings.
+- Fixed the shared `EmojiPicker` imports to resolve `src/lib` correctly.
+
+## Verification
+- `npm run typecheck` GÇö pass.
+- `npm test` GÇö pass (7 files, 10 tests).
+- ESLint on modified components GÇö pass.
+- Prettier check on all modified files GÇö pass.
+
+## Concerns
+- Browser smoke testing of feed/detail interactions and picker positioning was not available in this subtask environment.
+- Custom input relies on the server's emoji-grapheme validation, consistent with the API contract.
+
+## Report Path
+`C:\Users\pd680\mood-of-the-major\.superpowers\sdd\task-7-report.md`
+
+## Quality Findings Follow-up
+- Mirrored backend custom-reaction validation in the picker: trim, eight-code-unit maximum, ASCII-only rejection, and one-grapheme enforcement. Invalid input keeps the picker open with localized inline feedback.
+- Added localized mutation-error feedback instead of silently rolling back failed reaction updates.
+- Added Escape and outside-click dismissal with focus restoration to the add-reaction button.
+- Added `ReactionBar.test.tsx` coverage for default chips, owned active state, reaction-limit disabling, invalid custom input, both dismissal paths, focus restoration, and mutation errors.
+- `npm run typecheck` GÇö pass.
+- `npm test -- src/features/reactions/components/ReactionBar.test.tsx` GÇö pass (1 file, 7 tests).
+- ESLint on changed reaction components/test GÇö pass.
+- Prettier check on changed files GÇö pass after formatting.
diff --git a/frontend/src/components/EmojiPicker.tsx b/frontend/src/components/EmojiPicker.tsx
index c3435b7..274382b 100644
--- a/frontend/src/components/EmojiPicker.tsx
+++ b/frontend/src/components/EmojiPicker.tsx
@@ -1,6 +1,6 @@
 import { useTranslation } from "react-i18next";
-import { EMOTION_EMOJI_OPTIONS } from "../../lib/emotionEmoji";
-import { themeClasses } from "../../lib/themeClasses";
+import { EMOTION_EMOJI_OPTIONS } from "../lib/emotionEmoji";
+import { themeClasses } from "../lib/themeClasses";
 
 interface EmojiPickerProps {
   value: string;
diff --git a/frontend/src/features/reactions/components/ReactionBar.test.tsx b/frontend/src/features/reactions/components/ReactionBar.test.tsx
new file mode 100644
index 0000000..02a28b3
--- /dev/null
+++ b/frontend/src/features/reactions/components/ReactionBar.test.tsx
@@ -0,0 +1,136 @@
+import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
+import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
+import { I18nextProvider } from "react-i18next";
+import { MemoryRouter } from "react-router-dom";
+import { beforeEach, describe, expect, it, vi } from "vitest";
+import i18n from "../../../lib/i18n";
+import type { ReactionView } from "../../../types/engagement";
+import { ReactionBar } from "./ReactionBar";
+
+vi.mock("../../../hooks/useAuth", () => ({
+  useAuth: () => ({ isAuthenticated: true }),
+}));
+
+vi.mock("../../../services/reactionService", () => ({
+  fetchReactions: vi.fn(),
+  toggleReaction: vi.fn(),
+}));
+
+import { fetchReactions, toggleReaction } from "../../../services/reactionService";
+
+const mockFetchReactions = vi.mocked(fetchReactions);
+const mockToggleReaction = vi.mocked(toggleReaction);
+
+function renderReactionBar(data: ReactionView) {
+  mockFetchReactions.mockResolvedValue(data);
+  const queryClient = new QueryClient({
+    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
+  });
+
+  return {
+    queryClient,
+    ...screen,
+    renderResult: (
+      <I18nextProvider i18n={i18n}>
+        <MemoryRouter>
+          <QueryClientProvider client={queryClient}>
+            <ReactionBar targetType="mood" targetId="mood-1" />
+          </QueryClientProvider>
+        </MemoryRouter>
+      </I18nextProvider>
+    ),
+  };
+}
+
+async function mountReactionBar(data: ReactionView) {
+  const setup = renderReactionBar(data);
+  render(setup.renderResult);
+  await screen.findByTitle("Empathy");
+  return setup;
+}
+
+const baseData: ReactionView = {
+  targetType: "mood",
+  targetId: "mood-1",
+  reactionSummary: {},
+  userReactions: [],
+};
+
+describe("ReactionBar", () => {
+  beforeEach(() => {
+    vi.clearAllMocks();
+  });
+
+  it("always renders the default reaction chips", async () => {
+    await mountReactionBar(baseData);
+
+    for (const emoji of ["=ƒÆÖ", "=ƒñ¥", "=ƒ½é", "G£è"]) {
+      expect(screen.getByRole("button", { name: emoji })).toBeInTheDocument();
+    }
+  });
+
+  it("marks an owned reaction chip active", async () => {
+    await mountReactionBar({
+      ...baseData,
+      reactionSummary: { "=ƒÆÖ": 2 },
+      userReactions: ["=ƒÆÖ"],
+    });
+
+    expect(screen.getByRole("button", { name: "=ƒÆÖ2" })).toHaveAttribute("aria-pressed", "true");
+  });
+
+  it("disables the add button at the reaction limit", async () => {
+    await mountReactionBar({
+      ...baseData,
+      userReactions: ["=ƒÆÖ", "=ƒñ¥", "=ƒ½é", "G£è", "=ƒÿÇ", "=ƒÑ¦", "=ƒîƒ"],
+    });
+
+    expect(screen.getByRole("button", { name: "Add reaction" })).toBeDisabled();
+  });
+
+  it("keeps the picker open and does not toggle invalid custom input", async () => {
+    await mountReactionBar(baseData);
+    fireEvent.click(screen.getByRole("button", { name: "Add reaction" }));
+    const dialog = screen.getByRole("dialog", { name: "Add reaction" });
+
+    fireEvent.change(within(dialog).getByRole("textbox"), { target: { value: "hello" } });
+    fireEvent.submit(within(dialog).getByRole("textbox").closest("form")!);
+
+    expect(screen.getByRole("dialog", { name: "Add reaction" })).toBeInTheDocument();
+    expect(screen.getByText("Enter one emoji (up to 8 characters)")).toBeInTheDocument();
+    expect(mockToggleReaction).not.toHaveBeenCalled();
+  });
+
+  it("closes on Escape and restores focus to the add button", async () => {
+    await mountReactionBar(baseData);
+    const addButton = screen.getByRole("button", { name: "Add reaction" });
+    fireEvent.click(addButton);
+
+    fireEvent.keyDown(document, { key: "Escape" });
+
+    expect(screen.queryByRole("dialog", { name: "Add reaction" })).not.toBeInTheDocument();
+    expect(addButton).toHaveFocus();
+  });
+
+  it("closes on an outside click and restores focus", async () => {
+    await mountReactionBar(baseData);
+    const addButton = screen.getByRole("button", { name: "Add reaction" });
+    fireEvent.click(addButton);
+
+    fireEvent.pointerDown(document.body);
+
+    expect(screen.queryByRole("dialog", { name: "Add reaction" })).not.toBeInTheDocument();
+    expect(addButton).toHaveFocus();
+  });
+
+  it("shows a mutation error", async () => {
+    mockToggleReaction.mockRejectedValue(new Error("network"));
+    await mountReactionBar(baseData);
+
+    fireEvent.click(screen.getByRole("button", { name: "=ƒÆÖ" }));
+
+    await waitFor(() => {
+      expect(screen.getByText("Could not update reaction")).toBeInTheDocument();
+    });
+  });
+});
diff --git a/frontend/src/features/reactions/components/ReactionBar.tsx b/frontend/src/features/reactions/components/ReactionBar.tsx
index ab0e1bc..de01e10 100644
--- a/frontend/src/features/reactions/components/ReactionBar.tsx
+++ b/frontend/src/features/reactions/components/ReactionBar.tsx
@@ -6,6 +6,10 @@ import { fetchReactions, toggleReaction } from "../../../services/reactionServic
 import { useAuth } from "../../../hooks/useAuth";
 import { Link } from "react-router-dom";
 import { ROUTES } from "../../../constants/routes";
+import { themeClasses } from "../../../lib/themeClasses";
+import { ReactionEmojiPicker } from "./ReactionEmojiPicker";
+
+const MAX_USER_REACTIONS = 7;
 
 interface ReactionBarProps {
   targetType: "mood" | "comment";
@@ -72,36 +76,65 @@ export function ReactionBar({ targetType, targetId, compact = false }: ReactionB
 
   const handleClick = (emoji: string) => {
     if (!isAuthenticated) return;
+    const isOwned = data.userReactions.includes(emoji);
+    if (!isOwned && data.userReactions.length >= MAX_USER_REACTIONS) return;
     mutation.mutate(emoji);
   };
 
+  const extraEmojis = Object.keys(data.reactionSummary).filter(
+    (emoji) =>
+      !DEFAULT_REACTION_EMOJIS.some((reaction) => reaction.emoji === emoji) &&
+      (data.reactionSummary[emoji] ?? 0) > 0,
+  );
+  const reactions = [
+    ...DEFAULT_REACTION_EMOJIS.map((reaction) => ({
+      emoji: reaction.emoji,
+      label: t(reaction.translationKey),
+    })),
+    ...extraEmojis.map((emoji) => ({ emoji, label: emoji })),
+  ];
+  const isAtLimit = data.userReactions.length >= MAX_USER_REACTIONS;
+
   return (
-    <div className={`flex flex-wrap gap-2 ${compact ? "text-xs" : "text-sm"}`}>
-      {DEFAULT_REACTION_EMOJIS.map((reaction) => {
+    <div className={`flex flex-wrap items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
+      {reactions.map((reaction) => {
         const count = data.reactionSummary[reaction.emoji] ?? 0;
         const isActive = data.userReactions.includes(reaction.emoji);
-        const label = t(reaction.translationKey);
+        const cannotAdd = isAtLimit && !isActive;
 
         return (
           <button
             key={reaction.emoji}
             type="button"
-            disabled={!isAuthenticated || mutation.isPending}
+            disabled={!isAuthenticated || mutation.isPending || cannotAdd}
             onClick={() => handleClick(reaction.emoji)}
-            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition ${
+            className={`inline-flex h-8 items-center gap-1 rounded-full border px-2.5 transition ${
               isActive
-                ? "border-orange-600 bg-orange-50 text-orange-900"
-                : "border-stone-200 bg-white text-stone-600 hover:border-orange-300"
+                ? "border-orange-600 bg-orange-50 text-orange-900 dark:border-orange-500 dark:bg-orange-950 dark:text-orange-100"
+                : "border-stone-200 bg-white text-stone-600 hover:border-orange-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-orange-700"
             } disabled:cursor-not-allowed disabled:opacity-60`}
-            title={label}
+            title={cannotAdd ? t("engagement.reactionLimit") : reaction.label}
+            aria-pressed={isActive}
           >
             <span>{reaction.emoji}</span>
             {count > 0 ? <span>{count}</span> : null}
           </button>
         );
       })}
+      <ReactionEmojiPicker
+        disabled={!isAuthenticated || mutation.isPending || isAtLimit}
+        onPick={handleClick}
+      />
+      {mutation.isError ? (
+        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
+          {t("engagement.reactionUpdateError")}
+        </span>
+      ) : null}
+      {isAuthenticated && isAtLimit ? (
+        <span className={`text-xs ${themeClasses.muted}`}>{t("engagement.reactionLimit")}</span>
+      ) : null}
       {!isAuthenticated ? (
-        <Link to={ROUTES.login} className="self-center text-xs text-stone-500 hover:text-orange-800">
+        <Link to={ROUTES.login} className={`self-center text-xs ${themeClasses.linkSubtle}`}>
           {t("engagement.logInToReact")}
         </Link>
       ) : null}
diff --git a/frontend/src/features/reactions/components/ReactionEmojiPicker.tsx b/frontend/src/features/reactions/components/ReactionEmojiPicker.tsx
new file mode 100644
index 0000000..070990e
--- /dev/null
+++ b/frontend/src/features/reactions/components/ReactionEmojiPicker.tsx
@@ -0,0 +1,150 @@
+import { useEffect, useRef, useState, type FormEvent } from "react";
+import { useTranslation } from "react-i18next";
+import { EMOTION_EMOJI_OPTIONS } from "../../../lib/emotionEmoji";
+import { themeClasses } from "../../../lib/themeClasses";
+import { DEFAULT_REACTION_EMOJIS } from "../../../types/engagement";
+
+interface ReactionEmojiPickerProps {
+  disabled: boolean;
+  onPick: (emoji: string) => void;
+}
+
+const PICKER_EMOJIS = [
+  ...DEFAULT_REACTION_EMOJIS.map(({ emoji }) => emoji),
+  ...EMOTION_EMOJI_OPTIONS,
+].filter((emoji, index, emojis) => emojis.indexOf(emoji) === index);
+
+function isValidReactionEmoji(value: string): boolean {
+  const emoji = value.trim();
+  if (!emoji || emoji.length > 8) return false;
+  if (/^[a-zA-Z0-9_\-\s./:]+$/.test(emoji)) return false;
+  return [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(emoji)].length === 1;
+}
+
+export function ReactionEmojiPicker({ disabled, onPick }: ReactionEmojiPickerProps) {
+  const { t } = useTranslation();
+  const [isOpen, setIsOpen] = useState(false);
+  const [customEmoji, setCustomEmoji] = useState("");
+  const [validationError, setValidationError] = useState("");
+  const pickerRef = useRef<HTMLDivElement>(null);
+  const triggerRef = useRef<HTMLButtonElement>(null);
+
+  const closePicker = () => {
+    setIsOpen(false);
+    setValidationError("");
+    triggerRef.current?.focus();
+  };
+
+  useEffect(() => {
+    if (!isOpen) return;
+
+    const handleKeyDown = (event: KeyboardEvent) => {
+      if (event.key === "Escape") closePicker();
+    };
+    const handlePointerDown = (event: PointerEvent) => {
+      if (!pickerRef.current?.contains(event.target as Node)) closePicker();
+    };
+
+    document.addEventListener("keydown", handleKeyDown);
+    document.addEventListener("pointerdown", handlePointerDown);
+    return () => {
+      document.removeEventListener("keydown", handleKeyDown);
+      document.removeEventListener("pointerdown", handlePointerDown);
+    };
+  }, [isOpen]);
+
+  const pickEmoji = (emoji: string) => {
+    onPick(emoji);
+    setCustomEmoji("");
+    closePicker();
+  };
+
+  const submitCustomEmoji = (event: FormEvent<HTMLFormElement>) => {
+    event.preventDefault();
+    const emoji = customEmoji.trim();
+    if (!isValidReactionEmoji(emoji)) {
+      setValidationError(t("engagement.reactionInvalid"));
+      return;
+    }
+    pickEmoji(emoji);
+  };
+
+  return (
+    <div ref={pickerRef} className="relative">
+      <button
+        ref={triggerRef}
+        type="button"
+        disabled={disabled}
+        onClick={() => {
+          if (isOpen) {
+            closePicker();
+          } else {
+            setIsOpen(true);
+          }
+        }}
+        aria-label={t("engagement.addReaction")}
+        aria-expanded={isOpen}
+        className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-stone-200 bg-white px-2 text-stone-600 transition hover:border-orange-300 hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-orange-700 dark:hover:text-orange-300"
+      >
+        +
+      </button>
+
+      {isOpen ? (
+        <div
+          role="dialog"
+          aria-label={t("engagement.addReaction")}
+          className={`absolute bottom-full left-0 z-20 mb-2 w-64 p-3 shadow-lg ${themeClasses.card}`}
+        >
+          <div className="grid grid-cols-7 gap-1">
+            {PICKER_EMOJIS.map((emoji) => (
+              <button
+                key={emoji}
+                type="button"
+                onClick={() => pickEmoji(emoji)}
+                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:hover:bg-stone-800"
+              >
+                <span aria-hidden="true">{emoji}</span>
+                <span className="sr-only">{emoji}</span>
+              </button>
+            ))}
+          </div>
+          <form onSubmit={submitCustomEmoji} className="mt-3 flex gap-2">
+            <label className="min-w-0 flex-1">
+              <span className="sr-only">{t("submissions.emojiCustom")}</span>
+              <input
+                type="text"
+                value={customEmoji}
+                onChange={(event) => {
+                  setCustomEmoji(event.target.value);
+                  setValidationError("");
+                }}
+                maxLength={8}
+                placeholder="=ƒÖé"
+                aria-label={t("submissions.emojiCustom")}
+                aria-describedby={validationError ? "reaction-emoji-error" : undefined}
+                aria-invalid={Boolean(validationError)}
+                className={`${themeClasses.input} py-1 text-center text-lg`}
+              />
+            </label>
+            <button
+              type="submit"
+              disabled={!customEmoji.trim()}
+              className="rounded-lg bg-orange-700 px-3 text-sm font-medium text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-orange-600 dark:hover:bg-orange-500"
+            >
+              {t("engagement.addReaction")}
+            </button>
+          </form>
+          {validationError ? (
+            <p
+              id="reaction-emoji-error"
+              role="alert"
+              className="mt-2 text-xs text-red-600 dark:text-red-400"
+            >
+              {validationError}
+            </p>
+          ) : null}
+        </div>
+      ) : null}
+    </div>
+  );
+}
diff --git a/frontend/src/locales/en/translation.json b/frontend/src/locales/en/translation.json
index 627b825..3cce3f0 100644
--- a/frontend/src/locales/en/translation.json
+++ b/frontend/src/locales/en/translation.json
@@ -267,6 +267,10 @@
       "other": "Other"
     },
     "logInToReact": "Log in to react",
+    "reactionLimit": "You can add up to 7 reactions",
+    "addReaction": "Add reaction",
+    "reactionInvalid": "Enter one emoji (up to 8 characters)",
+    "reactionUpdateError": "Could not update reaction",
     "reportModal": {
       "title": "Report content",
       "description": "Help keep the community safe. Reports are anonymous.",
diff --git a/frontend/src/locales/th/translation.json b/frontend/src/locales/th/translation.json
index 3452aa1..a818bb0 100644
--- a/frontend/src/locales/th/translation.json
+++ b/frontend/src/locales/th/translation.json
@@ -267,6 +267,10 @@
       "other": "a+¡a++a¦êa+Öa¦å"
     },
     "logInToReact": "a¦Ça+éa¦ëa+¦a+¬a+¦a¦êa+úa+¦a+Üa+Üa¦Ça+Pa++a¦êa+¡a¦üa+¬a+öa+ça+¢a+Åa+¦a+üa+¦a+úa+¦a+óa+¦",
+    "reactionLimit": "a+äa++a+ôa¦Ça+Pa+¦a¦êa+ía+¢a+Åa+¦a+üa+¦a+úa+¦a+óa+¦a¦äa+öa¦ëa+¬a+¦a+ça+¬a++a+ö 7 a+úa+¦a+óa+üa+¦a+ú",
+    "addReaction": "a¦Ça+Pa+¦a¦êa+ía+¢a+Åa+¦a+üa+¦a+úa+¦a+óa+¦",
+    "reactionInvalid": "a+üa+úa+¡a+üa+¡a+¦a¦éa+ía+êa+¦ 1 a+òa+¦a+º (a¦äa+ía¦êa¦Ça+üa+¦a+Ö 8 a+¡a+¦a+üa+éa+úa+¦)",
+    "reactionUpdateError": "a+¡a+¦a+¢a¦Ça+öa+òa+¢a+Åa+¦a+üa+¦a+úa+¦a+óa+¦a¦äa+ía¦êa+¬a+¦a¦Ça+úa¦ça+ê",
     "reportModal": {
       "title": "a+úa+¦a+óa+ça+¦a+Öa¦Ça+Öa++a¦ëa+¡a+½a+¦",
       "description": "a+èa¦êa+ºa+óa+úa+¦a+üa+¬a+¦a+äa+ºa+¦a+ía+¢a+Ña+¡a+öa+áa+¦a+óa+éa+¡a+ça+èa++a+ía+èa+Ö a+üa+¦a+úa+úa+¦a+óa+ça+¦a+Öa¦Ça+¢a¦ça+Öa¦üa+Üa+Üa¦äa+ía¦êa¦Ça+¢a+¦a+öa¦Ça+£a+óa+òa+¦a+ºa+òa+Ö",
