import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatedMoodItem, AnimatedMoodList } from "../components/AnimatedMoodList";
import { MoodCard } from "../components/MoodCard";
import { EmptyState } from "../components/EmptyState";
import { MoodCardSkeleton } from "../components/Skeleton";
import { ROUTES } from "../constants/routes";
import { DEFAULT_MOOD_FILTERS, type MoodFilters } from "../features/search/types";
import { useMoodFeed } from "../features/feed/hooks/useMoodFeed";

const FilterPanel = lazy(() =>
  import("../features/search/components/FilterPanel").then((module) => ({
    default: module.FilterPanel,
  })),
);

function FilterPanelFallback() {
  return <div className="h-32 animate-pulse rounded-xl border border-stone-200 bg-stone-100" />;
}

export function FeedPage() {
  const [filters, setFilters] = useState<MoodFilters>(DEFAULT_MOOD_FILTERS);
  const feedQuery = useMoodFeed({ type: "global", params: filters });
  const moods = useMemo(
    () => feedQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [feedQuery.data],
  );

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">Mood feed</h1>
          <p className="mt-2 text-stone-600">Anonymous posts from students across campus.</p>
        </div>
        <Link
          to={ROUTES.create}
          className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Share mood
        </Link>
      </div>

      <Suspense fallback={<FilterPanelFallback />}>
        <FilterPanel filters={filters} onChange={setFilters} />
      </Suspense>

      {feedQuery.isLoading ? (
        <div className="mt-6 space-y-4">
          <MoodCardSkeleton />
          <MoodCardSkeleton />
        </div>
      ) : feedQuery.isError ? (
        <EmptyState
          title="Could not load feed"
          description="Please check your connection and try again."
          action={
            <button
              type="button"
              onClick={() => void feedQuery.refetch()}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
            >
              Retry
            </button>
          }
        />
      ) : moods.length === 0 ? (
        <EmptyState
          title="No moods yet"
          description="Be the first to share how you're feeling."
          action={
            <Link
              to={ROUTES.create}
              className="inline-block rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Create a mood
            </Link>
          }
        />
      ) : (
        <AnimatedMoodList>
          {moods.map((mood) => (
            <AnimatedMoodItem key={mood.id}>
              <MoodCard mood={mood} showBookmark />
            </AnimatedMoodItem>
          ))}

          {feedQuery.hasNextPage ? (
            <button
              type="button"
              onClick={() => void feedQuery.fetchNextPage()}
              disabled={feedQuery.isFetchingNextPage}
              className="w-full rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-60"
            >
              {feedQuery.isFetchingNextPage ? "Loading..." : "Load more"}
            </button>
          ) : null}
        </AnimatedMoodList>
      )}
    </section>
  );
}
