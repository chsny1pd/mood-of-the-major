import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import { ChartContainer } from "../features/statistics/components/ChartContainer";
import { DistributionChart } from "../features/statistics/components/DistributionChart";
import { ScopeSelector, type ScopeSelection } from "../features/statistics/components/ScopeSelector";
import { TimeSeriesChart } from "../features/statistics/components/TimeSeriesChart";
import { TrendingEmotionChip } from "../features/statistics/components/TrendingEmotionChip";
import { WeekdayActivityChart } from "../features/statistics/components/WeekdayActivityChart";
import { fetchStatisticsDashboard, fetchTrendingEmotions } from "../services/statisticsService";
import { getApiErrorMessage } from "../services/apiClient";
import { themeClasses } from "../lib/themeClasses";

export function DashboardPage() {
  const { t } = useTranslation();
  const [scope, setScope] = useState<ScopeSelection>({ scope: "platform" });
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const trendingWindow = period === "7d" ? "7d" : "30d";

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

  const trendingQuery = useQuery({
    queryKey: queryKeys.trending({ ...scope, window: trendingWindow }),
    queryFn: () =>
      fetchTrendingEmotions({
        scope: scope.scope,
        scopeId: scope.scopeId,
        window: trendingWindow,
      }),
    enabled: scopeReady,
  });

  const data = dashboardQuery.data;

  return (
    <section className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-10 top-0 h-36 w-36 rounded-full bg-orange-400/15 blur-3xl dark:bg-orange-500/10"
      />
      <div className="relative">
        <h1 className="font-display text-3xl font-semibold text-stone-900 dark:text-stone-100">
          {t("dashboard.pageTitle")}
        </h1>
        <p className={`mt-1 text-sm ${themeClasses.body}`}>{t("dashboard.description")}</p>

        <div className="mt-6 space-y-4">
          <ScopeSelector value={scope} onChange={setScope} />

          <label className="block w-full max-w-xs text-sm">
            <span className={`mb-1 block font-medium ${themeClasses.label}`}>
              {t("statistics.period")}
            </span>
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as typeof period)}
              className={themeClasses.select}
            >
              <option value="7d">{t("statistics.period7d")}</option>
              <option value="30d">{t("statistics.period30d")}</option>
              <option value="90d">{t("statistics.period90d")}</option>
            </select>
          </label>
        </div>

        {!scopeReady ? (
          <p className={`mt-8 text-sm ${themeClasses.muted}`}>{t("statistics.selectScopeHint")}</p>
        ) : dashboardQuery.isLoading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((key) => (
              <div key={key} className="h-24 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800" />
            ))}
          </div>
        ) : dashboardQuery.isError ? (
          <EmptyState
            title={t("statistics.loadErrorTitle")}
            description={getApiErrorMessage(dashboardQuery.error, t("common.tryAgainLater"))}
          />
        ) : data ? (
          <div className="mt-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <KpiCard label={t("statistics.kpiMoods")} value={data.overview.totalMoods} />
              <KpiCard label={t("statistics.kpiComments")} value={data.overview.totalComments} />
              <KpiCard label={t("statistics.kpiReactions")} value={data.overview.totalReactions} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChartContainer title={t("statistics.emotionDistribution")} meetsThreshold={data.meetsThreshold}>
                <DistributionChart data={data.distribution} />
              </ChartContainer>
              <ChartContainer title={t("dashboard.weekdayActivity")} meetsThreshold={data.overview.meetsThreshold}>
                <WeekdayActivityChart data={data.timeSeries} />
              </ChartContainer>
            </div>

            <ChartContainer title={t("statistics.activityOverTime")} meetsThreshold={data.overview.meetsThreshold}>
              <TimeSeriesChart data={data.timeSeries} />
            </ChartContainer>

            <div className={`p-5 ${themeClasses.cardLg}`}>
              <h2 className={`text-base font-semibold ${themeClasses.heading}`}>
                {t("dashboard.trendingTitle")}
              </h2>
              <p className={`mt-1 text-sm ${themeClasses.muted}`}>{t("dashboard.trendingDescription")}</p>
              {trendingQuery.isLoading ? (
                <div className="mt-4 space-y-3">
                  {[1, 2, 3].map((key) => (
                    <div key={key} className="h-16 animate-pulse rounded-xl bg-stone-100 dark:bg-stone-800" />
                  ))}
                </div>
              ) : trendingQuery.isError ? (
                <p className={`mt-4 text-sm ${themeClasses.muted}`}>
                  {getApiErrorMessage(trendingQuery.error, t("common.tryAgainLater"))}
                </p>
              ) : trendingQuery.data?.trending.length === 0 ? (
                <p className={`mt-4 text-sm ${themeClasses.muted}`}>{t("trending.emptyDescription")}</p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {trendingQuery.data?.trending.map((item) => (
                    <TrendingEmotionChip key={item.tag.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function KpiCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className={`p-4 ${themeClasses.card}`}>
      <p className={`text-sm ${themeClasses.muted}`}>{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${themeClasses.heading}`}>
        {value === null ? "—" : value.toLocaleString()}
      </p>
    </div>
  );
}
