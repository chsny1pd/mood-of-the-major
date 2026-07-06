import {
  STATISTICS_ALGORITHM_VERSION,
  type TrendingWindow,
} from "../../domain/constants/statisticsConstants.js";
import type { IDailyStatisticsRepository } from "../../domain/ports/IDailyStatisticsRepository.js";
import type { ITagRepository } from "../../domain/ports/ITagRepository.js";
import { AggregationThresholdPolicy } from "../../domain/services/AggregationThresholdPolicy.js";
import { resolveScopeType } from "./StatisticsAggregationJob.js";
import type { StatisticsScopeType } from "../../domain/constants/statisticsConstants.js";

export interface TrendingItem {
  tag: { id: string; slug: string; name: string };
  moodCount: number | null;
  delta: number | null;
  direction: "rising" | "declining" | "stable";
  meetsThreshold: boolean;
}

export interface TrendingResult {
  scope: { type: StatisticsScopeType; id?: string | null };
  window: TrendingWindow;
  trending: TrendingItem[];
  calculatedAt: string;
}

function utcDayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export class TrendingService {
  constructor(
    private readonly dailyStats: IDailyStatisticsRepository,
    private readonly tags: ITagRepository,
    private readonly thresholdPolicy: AggregationThresholdPolicy,
  ) {}

  async getTrending(input: {
    scope?: string;
    scopeId?: string;
    window?: string;
  }): Promise<TrendingResult> {
    const scopeType = resolveScopeType(input.scope ?? "platform");
    const scopeId = scopeType === "platform" ? null : (input.scopeId ?? null);
    const window = (input.window === "30d" ? "30d" : "7d") as TrendingWindow;
    const windowDays = window === "30d" ? 30 : 7;

    const now = utcDayStart(new Date());
    const currentFrom = new Date(now);
    currentFrom.setUTCDate(currentFrom.getUTCDate() - windowDays);

    const priorTo = new Date(currentFrom);
    priorTo.setUTCDate(priorTo.getUTCDate() - 1);
    const priorFrom = new Date(priorTo);
    priorFrom.setUTCDate(priorFrom.getUTCDate() - windowDays);

    const [currentRows, priorRows, tagList] = await Promise.all([
      this.dailyStats.sumByTagInWindow({
        scopeType,
        scopeId,
        from: currentFrom,
        to: now,
        algorithmVersion: STATISTICS_ALGORITHM_VERSION,
      }),
      this.dailyStats.sumByTagInWindow({
        scopeType,
        scopeId,
        from: priorFrom,
        to: priorTo,
        algorithmVersion: STATISTICS_ALGORITHM_VERSION,
      }),
      this.tags.findAllActiveEmotions(),
    ]);

    const tagMap = new Map(tagList.map((tag) => [tag.id, tag]));
    const priorMap = new Map(
      priorRows.filter((row) => row.tagId).map((row) => [row.tagId!, row.moodCount]),
    );

    const trending: TrendingItem[] = currentRows
      .filter((row) => row.tagId)
      .map((row) => {
        const tagId = row.tagId!;
        const priorCount = priorMap.get(tagId) ?? 0;
        const delta = row.moodCount - priorCount;
        const meetsThreshold = this.thresholdPolicy.meetsThreshold(row.moodCount);
        const tag = tagMap.get(tagId);

        let direction: TrendingItem["direction"] = "stable";
        if (delta > 0) direction = "rising";
        else if (delta < 0) direction = "declining";

        return {
          tag: tag
            ? { id: tag.id, slug: tag.slug, name: tag.name }
            : { id: tagId, slug: "unknown", name: "Unknown" },
          moodCount: meetsThreshold ? row.moodCount : null,
          delta: meetsThreshold ? delta : null,
          direction,
          meetsThreshold,
        };
      })
      .sort((a, b) => (b.moodCount ?? 0) - (a.moodCount ?? 0))
      .slice(0, 10);

    return {
      scope: { type: scopeType, id: scopeId },
      window,
      trending,
      calculatedAt: new Date().toISOString(),
    };
  }
}
