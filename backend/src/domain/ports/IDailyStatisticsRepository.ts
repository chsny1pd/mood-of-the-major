import type {
  DailyStatistics,
  UpsertDailyStatisticsInput,
} from "../entities/DailyStatistics.js";
import type { StatisticsScopeType } from "../constants/statisticsConstants.js";

export interface DailyStatisticsQuery {
  scopeType: StatisticsScopeType;
  scopeId?: string | null;
  from: Date;
  to: Date;
  tagId?: string | null;
  algorithmVersion?: string;
}

export interface IDailyStatisticsRepository {
  upsert(input: UpsertDailyStatisticsInput): Promise<DailyStatistics>;
  findByScopeAndDateRange(query: DailyStatisticsQuery): Promise<DailyStatistics[]>;
  sumByTagInWindow(input: {
    scopeType: StatisticsScopeType;
    scopeId: string | null;
    from: Date;
    to: Date;
    algorithmVersion?: string;
  }): Promise<Array<{ tagId: string | null; moodCount: number; commentCount: number; reactionCount: number }>>;
}
