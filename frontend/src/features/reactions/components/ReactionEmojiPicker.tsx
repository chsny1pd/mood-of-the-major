import { useState, type FormEvent } from "react";
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

export function ReactionEmojiPicker({ disabled, onPick }: ReactionEmojiPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [customEmoji, setCustomEmoji] = useState("");

  const pickEmoji = (emoji: string) => {
    onPick(emoji);
    setCustomEmoji("");
    setIsOpen(false);
  };

  const submitCustomEmoji = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emoji = customEmoji.trim();
    if (emoji) pickEmoji(emoji);
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
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
                onChange={(event) => setCustomEmoji(event.target.value.slice(0, 8))}
                maxLength={8}
                placeholder="🙂"
                aria-label={t("submissions.emojiCustom")}
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
        </div>
      ) : null}
    </div>
  );
}
