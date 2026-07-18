import { useTranslation } from "react-i18next";
import { EMOTION_EMOJI_OPTIONS } from "../../lib/emotionEmoji";
import { themeClasses } from "../../lib/themeClasses";

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  required?: boolean;
}

export function EmojiPicker({ value, onChange, required = false }: EmojiPickerProps) {
  const { t } = useTranslation();

  return (
    <div>
      <span className={`mb-1.5 block ${themeClasses.label}`}>
        {t("submissions.emoji")}
        {required ? " *" : ""}
      </span>
      <div
        role="listbox"
        aria-label={t("submissions.emoji")}
        className="grid grid-cols-8 gap-1.5 sm:grid-cols-12"
      >
        {EMOTION_EMOJI_OPTIONS.map((emoji) => {
          const selected = value === emoji;
          return (
            <button
              key={emoji}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(emoji)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition ${
                selected
                  ? "bg-orange-100 ring-2 ring-orange-500 dark:bg-orange-950 dark:ring-orange-400"
                  : "bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700"
              }`}
            >
              <span aria-hidden="true">{emoji}</span>
            </button>
          );
        })}
      </div>
      <label className={`mt-2 block ${themeClasses.label}`}>
        <span className="mb-1 block text-xs font-normal">{t("submissions.emojiCustom")}</span>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, 8))}
          maxLength={8}
          placeholder="🙂"
          aria-label={t("submissions.emojiCustom")}
          className={`${themeClasses.input} max-w-[6rem] text-center text-lg`}
        />
      </label>
    </div>
  );
}
