import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { MoodCard } from "../components/MoodCard";
import { EmptyState } from "../components/EmptyState";
import { MoodCardSkeleton } from "../components/Skeleton";
import { queryKeys } from "../constants/queryKeys";
import { searchMoods } from "../services/moodService";
import { getApiErrorMessage } from "../services/apiClient";

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const activeQuery = searchParams.get("q") ?? "";

  const searchQuery = useQuery({
    queryKey: queryKeys.moodSearch({ q: activeQuery }),
    queryFn: () => searchMoods({ q: activeQuery }),
    enabled: activeQuery.length >= 2,
  });

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">Search moods</h1>
      <p className="mt-1 text-sm text-stone-600">Find posts by keyword (min 2 characters).</p>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (query.trim().length >= 2) {
            setSearchParams({ q: query.trim() });
          }
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
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

      {activeQuery.length < 2 ? (
        <p className="mt-8 text-sm text-stone-500">Enter at least 2 characters to search.</p>
      ) : searchQuery.isLoading ? (
        <div className="mt-8 space-y-4">
          <MoodCardSkeleton />
          <MoodCardSkeleton />
        </div>
      ) : searchQuery.isError ? (
        <EmptyState
          title="Search failed"
          description={getApiErrorMessage(searchQuery.error, "Please try again.")}
        />
      ) : searchQuery.data?.data.length === 0 ? (
        <EmptyState title="No results" description={`Nothing matched "${activeQuery}".`} />
      ) : (
        <div className="mt-8 space-y-4">
          {searchQuery.data?.data.map((mood) => (
            <MoodCard key={mood.id} mood={mood} />
          ))}
        </div>
      )}
    </section>
  );
}
