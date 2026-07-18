import { useTranslation } from "react-i18next";
import { MoodCard } from "../components/MoodCard";
import { EmptyState } from "../components/EmptyState";
import { MoodCardSkeleton } from "../components/Skeleton";
import { FilterPanel } from "../features/search/components/FilterPanel";
import { useSearchResults } from "../features/search/hooks/useSearchResults";
import { themeClasses } from "../lib/themeClasses";
import { getApiErrorMessage } from "../services/apiClient";

export function SearchPage() {
  const { t } = useTranslation();
  const { filters, activeQuery, queryInput, setQueryInput, query, updateFilters } = useSearchResults();
  const moods = query.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className={themeClasses.pageTitle}>{t("search.pageTitle")}</h1>
      <p className={`mt-1 text-sm ${themeClasses.body}`}>{t("search.description")}</p>

      <div className="mt-6">
        <input
          type="search"
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          placeholder={t("search.placeholder")}
          aria-label={t("search.placeholder")}
          className={themeClasses.input}
        />
      </div>

      <div className="mt-4">
        <FilterPanel filters={filters} onChange={updateFilters} showSort={false} />
      </div>

      {activeQuery.length < 2 ? (
        <p className={`mt-8 text-sm ${themeClasses.muted}`}>{t("search.minCharsHint")}</p>
      ) : query.isLoading ? (
        <div className="mt-8 space-y-4">
          <MoodCardSkeleton />
          <MoodCardSkeleton />
        </div>
      ) : query.isError ? (
        <EmptyState
          title={t("search.errorTitle")}
          description={getApiErrorMessage(query.error, t("search.errorDescription"))}
        />
      ) : moods.length === 0 ? (
        <EmptyState
          title={t("search.noResultsTitle")}
          description={t("search.noResultsDescription", { query: activeQuery })}
        />
      ) : (
        <div className="mt-8 space-y-4">
          {moods.map((mood) => (
            <MoodCard key={mood.id} mood={mood} showBookmark />
          ))}

          {query.hasNextPage ? (
            <button
              type="button"
              onClick={() => void query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
              className={`w-full rounded-xl border px-4 py-2 text-sm disabled:opacity-60 ${themeClasses.border} ${themeClasses.body} ${themeClasses.hoverRow}`}
            >
              {query.isFetchingNextPage ? t("common.loading") : t("feed.loadMore")}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
