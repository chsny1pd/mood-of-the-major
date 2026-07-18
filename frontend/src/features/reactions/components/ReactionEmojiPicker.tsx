import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { EMOTION_EMOJI_OPTIONS } from "../../../lib/emotionEmoji";
import { themeClasses } from "../../../lib/themeClasses";
import { DEFAULT_REACTION_EMOJIS } from "../../../types/engagement";

interface ReactionEmojiPickerProps {
  disabled: boolean;
  onPick: (emoji: string) => void;
}

const PICKER_EMOJIS = [
  ...DEFAULT_REACTION_EMOJIS.map(({ emoji }) => emoji),
  ...EMOTION_EMOJI_OPTIONS,
].filter((emoji, index, emojis) => emojis.indexOf(emoji) === index);

function isValidReactionEmoji(value: string): boolean {
  const emoji = value.trim();
  if (!emoji || emoji.length > 8) return false;
  if (/^[a-zA-Z0-9_\-\s./:]+$/.test(emoji)) return false;
  return [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(emoji)].length === 1;
}

export function ReactionEmojiPicker({ disabled, onPick }: ReactionEmojiPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [customEmoji, setCustomEmoji] = useState("");
  const [validationError, setValidationError] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closePicker = () => {
    setIsOpen(false);
    setValidationError("");
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePicker();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) closePicker();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  const pickEmoji = (emoji: string) => {
    onPick(emoji);
    setCustomEmoji("");
    closePicker();
  };

  const submitCustomEmoji = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emoji = customEmoji.trim();
    if (!isValidReactionEmoji(emoji)) {
      setValidationError(t("engagement.reactionInvalid"));
      return;
    }
    pickEmoji(emoji);
  };

  return (
    <div ref={pickerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (isOpen) {
            closePicker();
          } else {
            setIsOpen(true);
          }
        }}
        aria-label={t("engagement.addReaction")}
        aria-expanded={isOpen}
        className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-stone-200 bg-white px-2 text-stone-600 transition hover:border-orange-300 hover:text-orange-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-orange-700 dark:hover:text-orange-300"
      >
        +
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label={t("engagement.addReaction")}
          className={`absolute bottom-full left-0 z-20 mb-2 w-64 p-3 shadow-lg ${themeClasses.card}`}
        >
          <div className="grid grid-cols-7 gap-1">
            {PICKER_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => pickEmoji(emoji)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:hover:bg-stone-800"
              >
                <span aria-hidden="true">{emoji}</span>
                <span className="sr-only">{emoji}</span>
              </button>
            ))}
          </div>
          <form onSubmit={submitCustomEmoji} className="mt-3 flex gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">{t("submissions.emojiCustom")}</span>
              <input
                type="text"
                value={customEmoji}
                onChange={(event) => {
                  setCustomEmoji(event.target.value);
                  setValidationError("");
                }}
                maxLength={8}
                placeholder="🙂"
                aria-label={t("submissions.emojiCustom")}
                aria-describedby={validationError ? "reaction-emoji-error" : undefined}
                aria-invalid={Boolean(validationError)}
                className={`${themeClasses.input} py-1 text-center text-lg`}
              />
            </label>
            <button
              type="submit"
              disabled={!customEmoji.trim()}
              className="rounded-lg bg-orange-700 px-3 text-sm font-medium text-white transition hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-orange-600 dark:hover:bg-orange-500"
            >
              {t("engagement.addReaction")}
            </button>
          </form>
          {validationError ? (
            <p
              id="reaction-emoji-error"
              role="alert"
              className="mt-2 text-xs text-red-600 dark:text-red-400"
            >
              {validationError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
