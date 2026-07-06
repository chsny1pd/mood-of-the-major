export const STATISTICS_ALGORITHM_VERSION = "v1";

export const STATISTICS_SCOPE_TYPES = ["platform", "faculty", "major"] as const;
export type StatisticsScopeType = (typeof STATISTICS_SCOPE_TYPES)[number];

export const STATISTICS_PERIOD_TYPES = [
  "all_time",
  "rolling_7d",
  "rolling_30d",
  "rolling_90d",
] as const;
export type StatisticsPeriodType = (typeof STATISTICS_PERIOD_TYPES)[number];

export const TRENDING_WINDOWS = ["7d", "30d"] as const;
export type TrendingWindow = (typeof TRENDING_WINDOWS)[number];

export const PERIOD_TO_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  rolling_7d: 7,
  rolling_30d: 30,
  rolling_90d: 90,
};
