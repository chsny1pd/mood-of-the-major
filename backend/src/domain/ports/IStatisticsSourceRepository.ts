import type { StatisticsScopeType } from "../../domain/constants/statisticsConstants.js";

export interface DailyAggregationRow {
  date: Date;
  scopeType: StatisticsScopeType;
  scopeId: string | null;
  tagId: string | null;
  moodCount: number;
  commentCount: number;
  reactionCount: number;
  activeMoodCount: number;
  uniqueParticipantCount: number;
}

export interface PeriodTagCount {
  scopeType: StatisticsScopeType;
  scopeId: string | null;
  tagId: string;
  moodCount: number;
}

export interface IStatisticsSourceRepository {
  aggregateDaily(from: Date, to: Date): Promise<DailyAggregationRow[]>;
  aggregatePeriodTagCounts(from: Date, to: Date): Promise<PeriodTagCount[]>;
  aggregateAllTimeTagCounts(): Promise<PeriodTagCount[]>;
}
