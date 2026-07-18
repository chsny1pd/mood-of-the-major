import "dotenv/config";
import { loadEnv } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
import { MoodModel } from "../src/infrastructure/database/models/Mood.js";
import { createLogger } from "../src/infrastructure/logging/logger.js";

function sumReactionSummary(summary: Record<string, number> | undefined): number {
  return Object.values(summary ?? {}).reduce((sum, count) => sum + (Number(count) || 0), 0);
}

async function backfillMoodReactionCounts(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);

  await connectDatabase(env.MONGODB_URI, logger);

  let scanned = 0;
  let updated = 0;

  const cursor = MoodModel.find({}).select("reactionSummary reactionCount").cursor();

  for await (const mood of cursor) {
    scanned += 1;
    const expected = sumReactionSummary(mood.reactionSummary as Record<string, number> | undefined);
    const current = typeof mood.reactionCount === "number" ? mood.reactionCount : -1;

    if (current === expected) {
      continue;
    }

    await MoodModel.updateOne({ _id: mood._id }, { $set: { reactionCount: expected } });
    updated += 1;
  }

  logger.info("Backfill mood reactionCount completed", { scanned, updated });
  await disconnectDatabase();
}

backfillMoodReactionCounts().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
