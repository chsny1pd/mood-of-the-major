import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { ScopeSelector, type ScopeSelection } from "../features/statistics/components/ScopeSelector";
import { TrendingEmotionChip } from "../features/statistics/components/TrendingEmotionChip";
import { fetchTrendingEmotions } from "../services/statisticsService";
import { getApiErrorMessage } from "../services/apiClient";

export function TrendingPage() {
  const [scope, setScope] = useState<ScopeSelection>({ scope: "platform" });
  const [window, setWindow] = useState<"7d" | "30d">("7d");

  const scopeReady =
    scope.scope === "platform" ||
    (scope.scope === "faculty" && Boolean(scope.scopeId)) ||
    (scope.scope === "major" && Boolean(scope.scopeId));

  const trendingQuery = useQuery({
    queryKey: queryKeys.trending({ ...scope, window }),
    queryFn: () =>
      fetchTrendingEmotions({
        scope: scope.scope,
        scopeId: scope.scopeId,
        window,
      }),
    enabled: scopeReady,
  });

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">Trending emotions</h1>
      <p className="mt-1 text-sm text-stone-600">
        Rising themes from recent activity — no individual posts are shown.
      </p>

      <div className="mt-6 space-y-4">
        <ScopeSelector value={scope} onChange={setScope} />

        <label className="block w-full max-w-xs text-sm">
          <span className="mb-1 block font-medium text-stone-700">Window</span>
          <select
            value={window}
            onChange={(event) => setWindow(event.target.value as typeof window)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </label>
      </div>

      {!scopeReady ? (
        <p className="mt-8 text-sm text-stone-500">Select a scope to view trending emotions.</p>
      ) : trendingQuery.isLoading ? (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((key) => (
            <div key={key} className="h-20 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : trendingQuery.isError ? (
        <EmptyState
          title="Could not load trending data"
          description={getApiErrorMessage(trendingQuery.error, "Try again later.")}
        />
      ) : trendingQuery.data?.trending.length === 0 ? (
        <EmptyState
          title="No trending data yet"
          description="Run the statistics aggregation job after mood activity builds up."
        />
      ) : (
        <div className="mt-8 grid gap-3">
          {trendingQuery.data?.trending.map((item) => (
            <TrendingEmotionChip key={item.tag.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
