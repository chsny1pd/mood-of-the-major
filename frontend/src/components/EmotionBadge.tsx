import { emotionEmoji } from "../lib/emotionEmoji";

export function EmotionBadge({
  name,
  slug,
  iconKey,
  isPrimary = false,
}: {
  name: string;
  slug?: string | null;
  iconKey?: string | null;
  isPrimary?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isPrimary
          ? "bg-orange-100 text-orange-900 ring-1 ring-orange-200"
          : "bg-stone-100 text-stone-700"
      }`}
    >
      <span aria-hidden="true">{emotionEmoji(iconKey, slug)}</span>
      {name}
    </span>
  );
}
