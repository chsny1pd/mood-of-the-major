import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AnimatedMoodItem, AnimatedMoodList } from "../components/AnimatedMoodList";
import { MoodCard } from "../components/MoodCard";
import { EmptyState } from "../components/EmptyState";
import { MoodCardSkeleton } from "../components/Skeleton";
import { ROUTES } from "../constants/routes";
import { queryKeys } from "../constants/queryKeys";
import { DEFAULT_MOOD_FILTERS, type MoodFilters } from "../features/search/types";
import { useMoodFeed } from "../features/feed/hooks/useMoodFeed";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { themeClasses } from "../lib/themeClasses";
import { searchMoods } from "../services/moodService";
import { getApiErrorMessage } from "../services/apiClient";

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
  const [queryInput, setQueryInput] = useState("");
  const debouncedQuery = useDebouncedValue(queryInput, 300);
  const activeQuery = debouncedQuery.trim();
  const isSearching = activeQuery.length >= 2;

  const feedQuery = useMoodFeed({ type: "global", params: filters });
  const searchQuery = useInfiniteQuery({
    queryKey: queryKeys.moodSearch({
      q: activeQuery,
      tagSlug: filters.tagSlug,
      facultyId: filters.facultyId,
      majorId: filters.majorId,
      from: filters.from,
      to: filters.to,
    }),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      searchMoods({
        q: activeQuery,
        tagSlug: filters.tagSlug,
        facultyId: filters.facultyId,
        majorId: filters.majorId,
        from: filters.from,
        to: filters.to,
        cursor: pageParam,
      }),
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
    enabled: isSearching,
  });

  const activeList = isSearching ? searchQuery : feedQuery;
  const moods = useMemo(
    () => activeList.data?.pages.flatMap((page) => page.data) ?? [],
    [activeList.data],
  );

  return (
    <section className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 top-0 h-40 w-40 rounded-full bg-orange-400/15 blur-3xl dark:bg-orange-500/10"
      />
      <div className="relative mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className={themeClasses.pageTitle}>
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

      <div className="relative space-y-4">
        <label className="block">
          <span className="sr-only">{t("search.placeholder")}</span>
          <input
            type="search"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder={t("search.placeholder")}
            aria-label={t("search.placeholder")}
            className={themeClasses.input}
          />
        </label>

        <Suspense fallback={<FilterPanelFallback />}>
          <FilterPanel filters={filters} onChange={setFilters} showSort={!isSearching} />
        </Suspense>

        {queryInput.trim().length > 0 && queryInput.trim().length < 2 ? (
          <p className={`text-sm ${themeClasses.muted}`}>{t("search.minCharsHint")}</p>
        ) : null}
      </div>

      {activeList.isLoading ? (
        <div className="mt-6 space-y-4">
          <MoodCardSkeleton />
          <MoodCardSkeleton />
        </div>
      ) : activeList.isError ? (
        <EmptyState
          title={isSearching ? t("search.errorTitle") : t("feed.errorTitle")}
          description={
            isSearching
              ? getApiErrorMessage(activeList.error, t("search.errorDescription"))
              : t("common.error")
          }
          action={
            <button
              type="button"
              onClick={() => void activeList.refetch()}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              {t("common.retry")}
            </button>
          }
        />
      ) : moods.length === 0 ? (
        <EmptyState
          title={isSearching ? t("search.noResultsTitle") : t("feed.emptyTitle")}
          description={
            isSearching
              ? t("search.noResultsDescription", { query: activeQuery })
              : t("feed.emptyBody")
          }
          action={
            isSearching ? undefined : (
              <Link
                to={ROUTES.create}
                className="inline-block rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 dark:bg-orange-500 dark:text-stone-950 dark:hover:bg-orange-400"
              >
                {t("feed.shareMood")}
              </Link>
            )
          }
        />
      ) : (
        <AnimatedMoodList>
          {moods.map((mood) => (
            <AnimatedMoodItem key={mood.id}>
              <MoodCard mood={mood} showBookmark />
            </AnimatedMoodItem>
          ))}

          {activeList.hasNextPage ? (
            <button
              type="button"
              onClick={() => void activeList.fetchNextPage()}
              disabled={activeList.isFetchingNextPage}
              className="w-full rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-60 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              {activeList.isFetchingNextPage ? t("common.loading") : t("feed.loadMore")}
            </button>
          ) : null}
        </AnimatedMoodList>
      )}
    </section>
  );
}
