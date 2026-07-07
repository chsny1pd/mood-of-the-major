import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MoodCard } from "../components/MoodCard";
import { EmptyState } from "../components/EmptyState";
import { MoodCardSkeleton } from "../components/Skeleton";
import { FilterPanel } from "../features/search/components/FilterPanel";
import { useSearchResults } from "../features/search/hooks/useSearchResults";
import { getApiErrorMessage } from "../services/apiClient";

export function SearchPage() {
  const { t } = useTranslation();
  const { filters, activeQuery, query, updateFilters, setQuery } = useSearchResults();
  const [draftQuery, setDraftQuery] = useState(activeQuery);
  const moods = query.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{t("search.pageTitle")}</h1>
      <p className="mt-1 text-sm text-stone-600">Find posts by keyword and filters (min 2 characters).</p>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (draftQuery.trim().length >= 2) {
            setQuery(draftQuery.trim());
          }
        }}
      >
        <input
          type="search"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
          placeholder="Search..."
          className="flex-1 rounded-xl border border-stone-300 px-3 py-2 outline-none ring-teal-700 focus:ring-2"
        />
        <button
          type="submit"
          className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900"
        >
          Search
        </button>
      </form>

      <div className="mt-4">
        <FilterPanel filters={filters} onChange={updateFilters} showSort={false} />
      </div>

      {activeQuery.length < 2 ? (
        <p className="mt-8 text-sm text-stone-500">Enter at least 2 characters to search.</p>
      ) : query.isLoading ? (
        <div className="mt-8 space-y-4">
          <MoodCardSkeleton />
          <MoodCardSkeleton />
        </div>
      ) : query.isError ? (
        <EmptyState
          title="Search failed"
          description={getApiErrorMessage(query.error, "Please try again.")}
        />
      ) : moods.length === 0 ? (
        <EmptyState title="No results" description={`Nothing matched "${activeQuery}".`} />
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
              className="w-full rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-60"
            >
              {query.isFetchingNextPage ? "Loading..." : "Load more"}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
