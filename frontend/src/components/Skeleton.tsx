export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-stone-200/80 ${className}`} aria-hidden="true" />;
}

export function MoodCardSkeleton() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <Skeleton className="mb-3 h-5 w-24" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
