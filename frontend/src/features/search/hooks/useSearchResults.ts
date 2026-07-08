import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { queryKeys } from "../../../constants/queryKeys";
import { searchMoods, type SearchParams } from "../../../services/moodService";
import type { MoodFilters } from "../types";

function parseFilters(params: URLSearchParams): MoodFilters & { q: string } {
  return {
    q: params.get("q") ?? "",
    tagSlug: params.get("tagSlug") ?? undefined,
    facultyId: params.get("facultyId") ?? undefined,
    majorId: params.get("majorId") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  };
}

export function useSearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFilters(searchParams);
  const activeQuery = filters.q;
  const [queryInput, setQueryInput] = useState(activeQuery);
  const debouncedQuery = useDebouncedValue(queryInput, 300);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed === activeQuery.trim()) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    if (trimmed.length >= 2) {
      next.set("q", trimmed);
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  }, [debouncedQuery, activeQuery, searchParams, setSearchParams]);

  const query = useInfiniteQuery({
    queryKey: queryKeys.moodSearch(filters),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => {
      const params: SearchParams = {
        q: activeQuery,
        tagSlug: filters.tagSlug,
        facultyId: filters.facultyId,
        majorId: filters.majorId,
        from: filters.from,
        to: filters.to,
        cursor: pageParam,
      };
      return searchMoods(params);
    },
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
    enabled: activeQuery.length >= 2,
  });

  const updateFilters = (patch: Partial<MoodFilters>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }
    setSearchParams(next);
  };

  return { filters, activeQuery, queryInput, setQueryInput, query, updateFilters };
}
