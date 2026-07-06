import type {
  EmotionStatistics,
  UpsertEmotionStatisticsInput,
} from "../entities/EmotionStatistics.js";
import type {
  StatisticsPeriodType,
  StatisticsScopeType,
} from "../constants/statisticsConstants.js";

export interface EmotionStatisticsQuery {
  scopeType: StatisticsScopeType;
  scopeId?: string | null;
  periodType: StatisticsPeriodType;
  algorithmVersion?: string;
}

export interface IEmotionStatisticsRepository {
  upsert(input: UpsertEmotionStatisticsInput): Promise<EmotionStatistics>;
  findByScope(query: EmotionStatisticsQuery): Promise<EmotionStatistics[]>;
  deleteByScope(query: EmotionStatisticsQuery): Promise<void>;
}
