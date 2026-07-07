export type StatisticsScopeType = "platform" | "faculty" | "major";

export interface StatisticsScope {
  type: StatisticsScopeType;
  id?: string | null;
}

export interface DistributionItem {
  tag: { id: string; slug: string; name: string; nameTh?: string | null };
  moodCount: number | null;
  percentage: number | null;
  rank: number | null;
  meetsThreshold: boolean;
}

export interface TimeSeriesPoint {
  date: string;
  moodCount: number | null;
  commentCount: number | null;
  reactionCount: number | null;
  meetsThreshold: boolean;
}

export interface DashboardData {
  scope: StatisticsScope;
  period: string;
  overview: {
    totalMoods: number | null;
    totalComments: number | null;
    totalReactions: number | null;
    meetsThreshold: boolean;
    calculatedAt: string | null;
  };
  distribution: DistributionItem[];
  timeSeries: TimeSeriesPoint[];
  meetsThreshold: boolean;
}

export interface TrendingItem {
  tag: { id: string; slug: string; name: string; nameTh?: string | null };
  moodCount: number | null;
  delta: number | null;
  direction: "rising" | "declining" | "stable";
  meetsThreshold: boolean;
}

export interface TrendingData {
  scope: StatisticsScope;
  window: "7d" | "30d";
  trending: TrendingItem[];
  calculatedAt: string;
}
