import "dotenv/config";
import { loadEnv } from "../src/config/env.js";
import { StatisticsAggregationJob } from "../src/application/services/StatisticsAggregationJob.js";
import { AggregationThresholdPolicy } from "../src/domain/services/AggregationThresholdPolicy.js";
import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
import { MongooseDailyStatisticsRepository } from "../src/infrastructure/database/repositories/MongooseDailyStatisticsRepository.js";
import { MongooseEmotionStatisticsRepository } from "../src/infrastructure/database/repositories/MongooseEmotionStatisticsRepository.js";
import { MongooseStatisticsSourceRepository } from "../src/infrastructure/database/repositories/MongooseStatisticsSourceRepository.js";
import { createLogger } from "../src/infrastructure/logging/logger.js";

async function runAggregation(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);

  await connectDatabase(env.MONGODB_URI, logger);

  const job = new StatisticsAggregationJob(
    new MongooseStatisticsSourceRepository(),
    new MongooseDailyStatisticsRepository(),
    new MongooseEmotionStatisticsRepository(),
    new AggregationThresholdPolicy(env.AGGREGATION_THRESHOLD_MIN),
  );

  const result = await job.run();

  logger.info("Statistics aggregation completed", { ...result });

  await disconnectDatabase();
}

runAggregation().catch((error) => {
  console.error("Aggregation failed:", error);
  process.exit(1);
});
