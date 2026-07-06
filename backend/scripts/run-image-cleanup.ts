import "dotenv/config";
import { ImageCleanupJob } from "../src/application/services/ImageCleanupJob.js";
import { loadEnv } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
import { MongooseMoodImageRepository } from "../src/infrastructure/database/repositories/MongooseMoodImageRepository.js";
import { createImageStorage } from "../src/infrastructure/storage/R2ImageStorage.js";
import { createLogger } from "../src/infrastructure/logging/logger.js";

async function runImageCleanup(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL, env.NODE_ENV);

  await connectDatabase(env.MONGODB_URI, logger);

  const job = new ImageCleanupJob(
    new MongooseMoodImageRepository(),
    createImageStorage(env),
    env.ORPHAN_IMAGE_TTL_HOURS,
    env.IMAGE_CLEANUP_BATCH_SIZE,
    logger,
  );

  const result = await job.run();

  logger.info("Image cleanup completed", { ...result });

  await disconnectDatabase();
}

runImageCleanup().catch((error) => {
  console.error("Image cleanup failed:", error);
  process.exit(1);
});
