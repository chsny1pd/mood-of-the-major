import {
  STATISTICS_ALGORITHM_VERSION,
  type StatisticsPeriodType,
  type StatisticsScopeType,
} from "../../domain/constants/statisticsConstants.js";
import type { IDailyStatisticsRepository } from "../../domain/ports/IDailyStatisticsRepository.js";
import type { IEmotionStatisticsRepository } from "../../domain/ports/IEmotionStatisticsRepository.js";
import type { ITagRepository } from "../../domain/ports/ITagRepository.js";
import { AggregationThresholdPolicy } from "../../domain/services/AggregationThresholdPolicy.js";
import { periodToDays, resolveScopeType } from "./StatisticsAggregationJob.js";

export interface StatisticsScope {
  type: StatisticsScopeType;
  id?: string | null;
}

export interface DistributionItem {
  tag: { id: string; slug: string; name: string; iconKey: string | null };
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

export interface DashboardOverview {
  totalMoods: number | null;
  totalComments: number | null;
  totalReactions: number | null;
  meetsThreshold: boolean;
  calculatedAt: string | null;
}

export interface DashboardResult {
  scope: StatisticsScope;
  period: string;
  overview: DashboardOverview;
  distribution: DistributionItem[];
  timeSeries: TimeSeriesPoint[];
  meetsThreshold: boolean;
}

export class StatisticsService {
  constructor(
    private readonly emotionStats: IEmotionStatisticsRepository,
    private readonly dailyStats: IDailyStatisticsRepository,
    private readonly tags: ITagRepository,
    private readonly thresholdPolicy: AggregationThresholdPolicy,
  ) {}

  async getDashboard(input: {
    scope: string;
    scopeId?: string;
    period?: string;
  }): Promise<DashboardResult> {
    const scopeType = resolveScopeType(input.scope);
    const scopeId = scopeType === "platform" ? null : (input.scopeId ?? null);
    const period = input.period ?? "30d";
    const periodType = this.mapPeriod(period);
    const days = periodToDays(period);

    const now = new Date();
    const from = new Date(now);
    from.setUTCDate(from.getUTCDate() - days);
    from.setUTCHours(0, 0, 0, 0);

    const [emotionRows, dailyRows, tagList] = await Promise.all([
      this.emotionStats.findByScope({
        scopeType,
        scopeId,
        periodType,
        algorithmVersion: STATISTICS_ALGORITHM_VERSION,
      }),
      this.dailyStats.findByScopeAndDateRange({
        scopeType,
        scopeId,
        from,
        to: now,
        tagId: null,
        algorithmVersion: STATISTICS_ALGORITHM_VERSION,
      }),
      this.tags.findAllActiveEmotions(),
    ]);

    const tagMap = new Map(tagList.map((tag) => [tag.id, tag]));
    const scopeTotalMoods = emotionRows.reduce((sum, row) => sum + row.moodCount, 0);
    const scopeMeetsThreshold = this.thresholdPolicy.meetsThreshold(scopeTotalMoods);

    const distribution: DistributionItem[] = emotionRows.map((row) => {
      const tag = tagMap.get(row.tagId);
      const showCounts = scopeMeetsThreshold && row.meetsThreshold;

      return {
        tag: tag
          ? { id: tag.id, slug: tag.slug, name: tag.name, iconKey: tag.iconKey }
          : { id: row.tagId, slug: "unknown", name: "Unknown", iconKey: null },
        moodCount: showCounts ? row.moodCount : null,
        percentage: showCounts ? row.percentage : null,
        rank: showCounts ? row.rank : null,
        meetsThreshold: row.meetsThreshold,
      };
    });

    const timeSeries: TimeSeriesPoint[] = dailyRows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      moodCount: row.meetsThreshold ? row.moodCount : null,
      commentCount: row.meetsThreshold ? row.commentCount : null,
      reactionCount: row.meetsThreshold ? row.reactionCount : null,
      meetsThreshold: row.meetsThreshold,
    }));

    const overviewTotals = dailyRows.reduce(
      (acc, row) => ({
        moods: acc.moods + row.moodCount,
        comments: acc.comments + row.commentCount,
        reactions: acc.reactions + row.reactionCount,
        calculatedAt: row.calculatedAt,
      }),
      { moods: 0, comments: 0, reactions: 0, calculatedAt: null as Date | null },
    );

    const overviewMeetsThreshold = this.thresholdPolicy.meetsThreshold(overviewTotals.moods);

    return {
      scope: { type: scopeType, id: scopeId },
      period,
      meetsThreshold: scopeMeetsThreshold,
      overview: {
        totalMoods: overviewMeetsThreshold ? overviewTotals.moods : null,
        totalComments: overviewMeetsThreshold ? overviewTotals.comments : null,
        totalReactions: overviewMeetsThreshold ? overviewTotals.reactions : null,
        meetsThreshold: overviewMeetsThreshold,
        calculatedAt: overviewTotals.calculatedAt?.toISOString() ?? null,
      },
      distribution,
      timeSeries,
    };
  }

  private mapPeriod(period: string): StatisticsPeriodType {
    switch (period) {
      case "7d":
        return "rolling_7d";
      case "90d":
        return "rolling_90d";
      default:
        return "rolling_30d";
    }
  }
}
