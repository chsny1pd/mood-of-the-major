import type { StatisticsScopeType } from "../constants/statisticsConstants.js";

export interface DailyStatistics {
  id: string;
  date: Date;
  scopeType: StatisticsScopeType;
  scopeId: string | null;
  tagId: string | null;
  moodCount: number;
  commentCount: number;
  reactionCount: number;
  activeMoodCount: number;
  uniqueParticipantCount: number | null;
  meetsThreshold: boolean;
  algorithmVersion: string;
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertDailyStatisticsInput {
  date: Date;
  scopeType: StatisticsScopeType;
  scopeId: string | null;
  tagId: string | null;
  moodCount: number;
  commentCount: number;
  reactionCount: number;
  activeMoodCount: number;
  uniqueParticipantCount: number | null;
  meetsThreshold: boolean;
  algorithmVersion: string;
  calculatedAt: Date;
}
