import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../constants/queryKeys";
import {
  fetchFacultyMoodFeed,
  fetchMajorMoodFeed,
  fetchMoodFeed,
  type FeedParams,
} from "../../../services/moodService";

type FeedScope =
  | { type: "global"; params?: FeedParams }
  | { type: "faculty"; facultyId: string; params?: FeedParams }
  | { type: "major"; majorId: string; params?: FeedParams };

async function fetchPage(scope: FeedScope, cursor?: string) {
  const params = { ...("params" in scope ? scope.params : {}), cursor };

  if (scope.type === "faculty") {
    return fetchFacultyMoodFeed(scope.facultyId, params);
  }

  if (scope.type === "major") {
    return fetchMajorMoodFeed(scope.majorId, params);
  }

  return fetchMoodFeed(params);
}

export function useMoodFeed(scope: FeedScope) {
  const scopeKey =
    scope.type === "global"
      ? "global"
      : scope.type === "faculty"
        ? `faculty:${scope.facultyId}`
        : `major:${scope.majorId}`;

  return useInfiniteQuery({
    queryKey: queryKeys.moodFeed(scopeKey, "params" in scope ? scope.params : undefined),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchPage(scope, pageParam),
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
  });
}
