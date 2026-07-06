import type { TrendingItem } from "../../../types/statistics";

interface TrendingEmotionChipProps {
  item: TrendingItem;
}

const directionLabel = {
  rising: "Rising",
  declining: "Declining",
  stable: "Stable",
} as const;

export function TrendingEmotionChip({ item }: TrendingEmotionChipProps) {
  const directionClass =
    item.direction === "rising"
      ? "border-teal-200 bg-teal-50 text-teal-900"
      : item.direction === "declining"
        ? "border-stone-200 bg-stone-50 text-stone-700"
        : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <article className={`rounded-xl border px-4 py-3 ${directionClass}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{item.tag.name}</h3>
        <span className="text-xs font-medium uppercase tracking-wide">
          {directionLabel[item.direction]}
        </span>
      </div>
      {item.meetsThreshold && item.moodCount !== null ? (
        <p className="mt-1 text-sm">
          {item.moodCount} moods
          {item.delta !== null ? (
            <span className="ml-2 text-stone-600">
              ({item.delta >= 0 ? "+" : ""}
              {item.delta} vs prior window)
            </span>
          ) : null}
        </p>
      ) : (
        <p className="mt-1 text-sm text-stone-500">Insufficient data</p>
      )}
    </article>
  );
}
