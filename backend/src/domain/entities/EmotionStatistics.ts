import type { StatisticsPeriodType, StatisticsScopeType } from "../constants/statisticsConstants.js";

export interface EmotionStatistics {
  id: string;
  scopeType: StatisticsScopeType;
  scopeId: string | null;
  tagId: string;
  periodType: StatisticsPeriodType;
  moodCount: number;
  percentage: number | null;
  rank: number | null;
  meetsThreshold: boolean;
  algorithmVersion: string;
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertEmotionStatisticsInput {
  scopeType: StatisticsScopeType;
  scopeId: string | null;
  tagId: string;
  periodType: StatisticsPeriodType;
  moodCount: number;
  percentage: number | null;
  rank: number | null;
  meetsThreshold: boolean;
  algorithmVersion: string;
  calculatedAt: Date;
}
