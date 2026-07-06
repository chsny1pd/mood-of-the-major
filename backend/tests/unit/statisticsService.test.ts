import { describe, expect, it, vi } from "vitest";
import { StatisticsService } from "../../src/application/services/StatisticsService.js";
import { AggregationThresholdPolicy } from "../../src/domain/services/AggregationThresholdPolicy.js";
import type { IDailyStatisticsRepository } from "../../src/domain/ports/IDailyStatisticsRepository.js";
import type { IEmotionStatisticsRepository } from "../../src/domain/ports/IEmotionStatisticsRepository.js";
import type { ITagRepository } from "../../src/domain/ports/ITagRepository.js";

describe("StatisticsService", () => {
  const thresholdPolicy = new AggregationThresholdPolicy(5);

  const tagList = [
    { id: "tag-stress", slug: "stress", name: "Stress", type: "emotion" as const, isActive: true },
    { id: "tag-joy", slug: "joy", name: "Joy", type: "emotion" as const, isActive: true },
  ];

  it("suppresses counts when scope is below aggregation threshold", async () => {
    const emotionStats = {
      findByScope: vi.fn().mockResolvedValue([
        {
          tagId: "tag-stress",
          moodCount: 3,
          percentage: 100,
          rank: 1,
          meetsThreshold: false,
        },
      ]),
    } as unknown as IEmotionStatisticsRepository;

    const dailyStats = {
      findByScopeAndDateRange: vi.fn().mockResolvedValue([
        {
          date: new Date("2026-06-01T00:00:00.000Z"),
          moodCount: 3,
          commentCount: 1,
          reactionCount: 2,
          meetsThreshold: false,
          calculatedAt: new Date("2026-06-01T12:00:00.000Z"),
        },
      ]),
    } as unknown as IDailyStatisticsRepository;

    const tags = {
      findAllActiveEmotions: vi.fn().mockResolvedValue(tagList),
    } as unknown as ITagRepository;

    const service = new StatisticsService(emotionStats, dailyStats, tags, thresholdPolicy);
    const result = await service.getDashboard({ scope: "platform", period: "30d" });

    expect(result.meetsThreshold).toBe(false);
    expect(result.overview.totalMoods).toBeNull();
    expect(result.distribution[0]?.moodCount).toBeNull();
    expect(result.timeSeries[0]?.moodCount).toBeNull();
  });

  it("returns counts when scope meets aggregation threshold", async () => {
    const emotionStats = {
      findByScope: vi.fn().mockResolvedValue([
        {
          tagId: "tag-stress",
          moodCount: 5,
          percentage: 62.5,
          rank: 1,
          meetsThreshold: true,
        },
        {
          tagId: "tag-joy",
          moodCount: 3,
          percentage: 37.5,
          rank: 2,
          meetsThreshold: false,
        },
      ]),
    } as unknown as IEmotionStatisticsRepository;

    const dailyStats = {
      findByScopeAndDateRange: vi.fn().mockResolvedValue([
        {
          date: new Date("2026-06-01T00:00:00.000Z"),
          moodCount: 8,
          commentCount: 2,
          reactionCount: 4,
          meetsThreshold: true,
          calculatedAt: new Date("2026-06-01T12:00:00.000Z"),
        },
      ]),
    } as unknown as IDailyStatisticsRepository;

    const tags = {
      findAllActiveEmotions: vi.fn().mockResolvedValue(tagList),
    } as unknown as ITagRepository;

    const service = new StatisticsService(emotionStats, dailyStats, tags, thresholdPolicy);
    const result = await service.getDashboard({ scope: "platform", period: "30d" });

    expect(result.meetsThreshold).toBe(true);
    expect(result.overview.totalMoods).toBe(8);
    expect(result.distribution[0]?.moodCount).toBe(5);
    expect(result.distribution[1]?.moodCount).toBeNull();
  });
});
