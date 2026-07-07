import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { ChartContainer } from "../features/statistics/components/ChartContainer";
import { DistributionChart } from "../features/statistics/components/DistributionChart";
import { ScopeSelector, type ScopeSelection } from "../features/statistics/components/ScopeSelector";
import { TimeSeriesChart } from "../features/statistics/components/TimeSeriesChart";
import { fetchStatisticsDashboard } from "../services/statisticsService";
import { getApiErrorMessage } from "../services/apiClient";

export function StatisticsPage() {
  const { t } = useTranslation();
  const [scope, setScope] = useState<ScopeSelection>({ scope: "platform" });
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const scopeReady =
    scope.scope === "platform" ||
    (scope.scope === "faculty" && Boolean(scope.scopeId)) ||
    (scope.scope === "major" && Boolean(scope.scopeId));

  const dashboardQuery = useQuery({
    queryKey: queryKeys.statisticsDashboard({ ...scope, period }),
    queryFn: () =>
      fetchStatisticsDashboard({
        scope: scope.scope,
        scopeId: scope.scopeId,
        period,
      }),
    enabled: scopeReady,
  });

  const data = dashboardQuery.data;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{t("statistics.pageTitle")}</h1>
      <p className="mt-1 text-sm text-stone-600">
        Aggregated mood insights — individual posts are never shown.
      </p>

      <div className="mt-6 space-y-4">
        <ScopeSelector value={scope} onChange={setScope} />

        <label className="block w-full max-w-xs text-sm">
          <span className="mb-1 block font-medium text-stone-700">Period</span>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as typeof period)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </label>
      </div>

      {!scopeReady ? (
        <p className="mt-8 text-sm text-stone-500">Select a scope to view statistics.</p>
      ) : dashboardQuery.isLoading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((key) => (
            <div key={key} className="h-24 animate-pulse rounded-xl bg-stone-100" />
          ))}
        </div>
      ) : dashboardQuery.isError ? (
        <EmptyState
          title="Could not load statistics"
          description={getApiErrorMessage(dashboardQuery.error, "Try again later.")}
        />
      ) : data ? (
        <div className="mt-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard label="Moods" value={data.overview.totalMoods} />
            <KpiCard label="Comments" value={data.overview.totalComments} />
            <KpiCard label="Reactions" value={data.overview.totalReactions} />
          </div>

          <ChartContainer title="Emotion distribution" meetsThreshold={data.meetsThreshold}>
            <DistributionChart data={data.distribution} />
          </ChartContainer>

          <ChartContainer title="Activity over time" meetsThreshold={data.overview.meetsThreshold}>
            <TimeSeriesChart data={data.timeSeries} />
          </ChartContainer>
        </div>
      ) : null}
    </section>
  );
}

function KpiCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-stone-900">
        {value === null ? "—" : value.toLocaleString()}
      </p>
    </div>
  );
}
