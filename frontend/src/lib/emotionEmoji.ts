/** Legacy slug → emoji for seeded tags that still store ascii iconKeys. */
const LEGACY_EMOTION_EMOJIS: Record<string, string> = {
  stress: "😫",
  joy: "😊",
  anxiety: "😰",
  gratitude: "🙏",
};

const FALLBACK_EMOJI = "🏷️";

/** Ascii identifiers (legacy iconKey / slug) vs a stored emoji glyph. */
function isLegacyIconKey(value: string): boolean {
  return /^[a-z0-9_-]+$/i.test(value);
}

/**
 * Resolve display emoji for an emotion tag.
 * Prefer `iconKey` when it holds an emoji; fall back to legacy slug map.
 */
export function emotionEmoji(
  iconKey?: string | null,
  slug?: string | null,
): string {
  if (iconKey) {
    if (!isLegacyIconKey(iconKey)) {
      return iconKey;
    }
    const fromKey = LEGACY_EMOTION_EMOJIS[iconKey];
    if (fromKey) {
      return fromKey;
    }
  }

  if (slug) {
    const fromSlug = LEGACY_EMOTION_EMOJIS[slug];
    if (fromSlug) {
      return fromSlug;
    }
  }

  return FALLBACK_EMOJI;
}

/** Curated emotion emojis for the picker UI. */
export const EMOTION_EMOJI_OPTIONS = [
  "😫",
  "😊",
  "😰",
  "🙏",
  "😢",
  "😡",
  "😴",
  "🤯",
  "🥰",
  "😔",
  "😤",
  "🥹",
  "😬",
  "🙄",
  "😌",
  "🤩",
  "💔",
  "💪",
  "🔥",
  "✨",
  "🌈",
  "☕",
  "📚",
  "🎯",
] as const;
