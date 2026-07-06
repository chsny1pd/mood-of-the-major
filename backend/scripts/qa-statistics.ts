import "dotenv/config";
import { loadEnv } from "../src/config/env.js";
import { StatisticsService } from "../src/application/services/StatisticsService.js";
import { StatisticsAggregationJob } from "../src/application/services/StatisticsAggregationJob.js";
import { TrendingService } from "../src/application/services/TrendingService.js";
import { AggregationThresholdPolicy } from "../src/domain/services/AggregationThresholdPolicy.js";
import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
import { MongooseDailyStatisticsRepository } from "../src/infrastructure/database/repositories/MongooseDailyStatisticsRepository.js";
import { MongooseEmotionStatisticsRepository } from "../src/infrastructure/database/repositories/MongooseEmotionStatisticsRepository.js";
import { MongooseStatisticsSourceRepository } from "../src/infrastructure/database/repositories/MongooseStatisticsSourceRepository.js";
import { MongooseTagRepository } from "../src/infrastructure/database/repositories/MongooseTagRepository.js";
import { MoodModel } from "../src/infrastructure/database/models/Mood.js";
import { createLogger } from "../src/infrastructure/logging/logger.js";

async function qaStatistics(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);
  const threshold = env.AGGREGATION_THRESHOLD_MIN;

  await connectDatabase(env.MONGODB_URI, logger);

  const activeMoods = await MoodModel.countDocuments({ status: "active", deletedAt: null });

  if (activeMoods < threshold) {
    logger.warn("Fewer active moods than aggregation threshold — run npm run seed:sample-moods first", {
      activeMoods,
      threshold,
    });
  }

  const source = new MongooseStatisticsSourceRepository();
  const dailyStats = new MongooseDailyStatisticsRepository();
  const emotionStats = new MongooseEmotionStatisticsRepository();
  const tags = new MongooseTagRepository();
  const thresholdPolicy = new AggregationThresholdPolicy(threshold);

  const job = new StatisticsAggregationJob(source, dailyStats, emotionStats, thresholdPolicy);
  const aggregation = await job.run();
  logger.info("Aggregation job finished", { ...aggregation });

  const statisticsService = new StatisticsService(emotionStats, dailyStats, tags, thresholdPolicy);
  const trendingService = new TrendingService(dailyStats, tags, thresholdPolicy);

  const dashboard = await statisticsService.getDashboard({ scope: "platform", period: "30d" });
  const trending = await trendingService.getTrending({ scope: "platform", window: "7d" });

  logger.info("Platform dashboard (30d)", {
    meetsThreshold: dashboard.meetsThreshold,
    totalMoods: dashboard.overview.totalMoods,
    distributionCount: dashboard.distribution.length,
    timeSeriesPoints: dashboard.timeSeries.length,
  });

  logger.info("Platform trending (7d)", {
    itemCount: trending.trending.length,
    topTags: trending.trending.slice(0, 3).map((item) => ({
      tag: item.tag.slug,
      moodCount: item.moodCount,
      meetsThreshold: item.meetsThreshold,
    })),
  });

  if (!dashboard.meetsThreshold) {
    logger.warn(
      "Dashboard below threshold — statistics pages will show empty/suppressed counts (expected until enough mood data exists)",
    );
  } else {
    logger.info("Sprint 5 statistics QA passed — aggregated data meets threshold");
  }

  await disconnectDatabase();
}

qaStatistics().catch((error) => {
  console.error("Statistics QA failed:", error);
  process.exit(1);
});
