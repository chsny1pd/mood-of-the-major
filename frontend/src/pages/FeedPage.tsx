import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  return (
    <div className="h-32 animate-pulse rounded-xl border border-stone-200 bg-stone-100 dark:border-stone-700 dark:bg-stone-800" />
  );
}

export function FeedPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<MoodFilters>(DEFAULT_MOOD_FILTERS);
  const feedQuery = useMoodFeed({ type: "global", params: filters });
  const moods = useMemo(
    () => feedQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [feedQuery.data],
  );

  return (
    <section className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-orange-400/15 blur-3xl dark:bg-orange-500/10"
      />
      <div className="relative mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
            {t("feed.title")}
          </h1>
          <p className="mt-2 text-stone-600 dark:text-stone-300">{t("feed.description")}</p>
        </div>
        <Link
          to={ROUTES.create}
          className="rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 dark:bg-orange-500 dark:text-stone-950 dark:hover:bg-orange-400"
        >
          {t("feed.shareMood")}
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
          title={t("feed.errorTitle")}
          description={t("common.error")}
          action={
            <button
              type="button"
              onClick={() => void feedQuery.refetch()}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              {t("common.retry")}
            </button>
          }
        />
      ) : moods.length === 0 ? (
        <EmptyState
          title={t("feed.emptyTitle")}
          description={t("feed.emptyBody")}
          action={
            <Link
              to={ROUTES.create}
              className="inline-block rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 dark:bg-orange-500 dark:text-stone-950 dark:hover:bg-orange-400"
            >
              {t("feed.shareMood")}
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
              className="w-full rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-60 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              {feedQuery.isFetchingNextPage ? t("common.loading") : t("feed.loadMore")}
            </button>
          ) : null}
        </AnimatedMoodList>
      )}
    </section>
  );
}
