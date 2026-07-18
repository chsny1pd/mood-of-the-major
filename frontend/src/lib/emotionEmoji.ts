/** Default emoji map for seeded emotion tag slugs / iconKeys. */
const EMOTION_EMOJIS: Record<string, string> = {
  stress: "😫",
  joy: "😊",
  anxiety: "😰",
  gratitude: "🙏",
};

const FALLBACK_EMOJI = "🏷️";

export function emotionEmoji(slugOrIconKey: string | null | undefined): string {
  if (!slugOrIconKey) {
    return FALLBACK_EMOJI;
  }
  return EMOTION_EMOJIS[slugOrIconKey] ?? FALLBACK_EMOJI;
}
