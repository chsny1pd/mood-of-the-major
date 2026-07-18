export function EmotionBadge({
  name,
  isPrimary = false,
}: {
  name: string;
  isPrimary?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isPrimary
          ? "bg-orange-100 text-orange-900 ring-1 ring-orange-200"
          : "bg-stone-100 text-stone-700"
      }`}
    >
      {name}
    </span>
  );
}
