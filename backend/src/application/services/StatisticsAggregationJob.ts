import {
  PERIOD_TO_DAYS,
  STATISTICS_ALGORITHM_VERSION,
  type StatisticsPeriodType,
  type StatisticsScopeType,
} from "../../domain/constants/statisticsConstants.js";
import type { IDailyStatisticsRepository } from "../../domain/ports/IDailyStatisticsRepository.js";
import type { IEmotionStatisticsRepository } from "../../domain/ports/IEmotionStatisticsRepository.js";
import type { IStatisticsSourceRepository } from "../../domain/ports/IStatisticsSourceRepository.js";
import { AggregationThresholdPolicy } from "../../domain/services/AggregationThresholdPolicy.js";

function utcDayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysAgo(days: number): Date {
  const now = utcDayStart(new Date());
  now.setUTCDate(now.getUTCDate() - days);
  return now;
}

export interface AggregationJobResult {
  dailyRows: number;
  emotionRows: number;
  calculatedAt: string;
}

export class StatisticsAggregationJob {
  constructor(
    private readonly source: IStatisticsSourceRepository,
    private readonly dailyStats: IDailyStatisticsRepository,
    private readonly emotionStats: IEmotionStatisticsRepository,
    private readonly thresholdPolicy: AggregationThresholdPolicy,
  ) {}

  async run(): Promise<AggregationJobResult> {
    const calculatedAt = new Date();
    const from = daysAgo(90);
    const to = calculatedAt;

    const dailyRows = await this.source.aggregateDaily(from, to);
    let dailyCount = 0;

    for (const row of dailyRows) {
      const totalActivity = row.moodCount + row.commentCount + row.reactionCount;
      await this.dailyStats.upsert({
        date: row.date,
        scopeType: row.scopeType,
        scopeId: row.scopeId,
        tagId: row.tagId,
        moodCount: row.moodCount,
        commentCount: row.commentCount,
        reactionCount: row.reactionCount,
        activeMoodCount: row.activeMoodCount,
        uniqueParticipantCount: row.uniqueParticipantCount,
        meetsThreshold: this.thresholdPolicy.meetsThreshold(totalActivity),
        algorithmVersion: STATISTICS_ALGORITHM_VERSION,
        calculatedAt,
      });
      dailyCount += 1;
    }

    const periods: Array<{ periodType: StatisticsPeriodType; from: Date | null }> = [
      { periodType: "rolling_7d", from: daysAgo(7) },
      { periodType: "rolling_30d", from: daysAgo(30) },
      { periodType: "rolling_90d", from: daysAgo(90) },
      { periodType: "all_time", from: null },
    ];

    let emotionCount = 0;

    for (const period of periods) {
      const counts =
        period.from === null
          ? await this.source.aggregateAllTimeTagCounts()
          : await this.source.aggregatePeriodTagCounts(period.from, to);

      const scopeGroups = new Map<string, typeof counts>();
      for (const row of counts) {
        const key = `${row.scopeType}|${row.scopeId ?? ""}`;
        const group = scopeGroups.get(key) ?? [];
        group.push(row);
        scopeGroups.set(key, group);
      }

      for (const [, group] of scopeGroups) {
        const scopeType = group[0]!.scopeType;
        const scopeId = group[0]!.scopeId;
        const totalMoods = group.reduce((sum, item) => sum + item.moodCount, 0);
        const scopeMeetsThreshold = this.thresholdPolicy.meetsThreshold(totalMoods);

        const sorted = [...group].sort((a, b) => b.moodCount - a.moodCount);

        await this.emotionStats.deleteByScope({
          scopeType,
          scopeId,
          periodType: period.periodType,
          algorithmVersion: STATISTICS_ALGORITHM_VERSION,
        });

        for (const [index, row] of sorted.entries()) {
          await this.emotionStats.upsert({
            scopeType: row.scopeType,
            scopeId: row.scopeId,
            tagId: row.tagId,
            periodType: period.periodType,
            moodCount: row.moodCount,
            percentage: totalMoods > 0 ? Math.round((row.moodCount / totalMoods) * 1000) / 10 : null,
            rank: index + 1,
            meetsThreshold: scopeMeetsThreshold && this.thresholdPolicy.meetsThreshold(row.moodCount),
            algorithmVersion: STATISTICS_ALGORITHM_VERSION,
            calculatedAt,
          });
          emotionCount += 1;
        }
      }
    }

    return {
      dailyRows: dailyCount,
      emotionRows: emotionCount,
      calculatedAt: calculatedAt.toISOString(),
    };
  }
}

export function periodToDays(period: string): number {
  return PERIOD_TO_DAYS[period] ?? 30;
}

export function resolveScopeType(scope: string): StatisticsScopeType {
  if (scope === "faculty" || scope === "major") {
    return scope;
  }
  return "platform";
}
