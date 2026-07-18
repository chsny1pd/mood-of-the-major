import "dotenv/config";
import type { Model } from "mongoose";
import { LEGACY_REACTION_SLUG_TO_EMOJI } from "../src/domain/constants/engagementConstants.js";
import { loadEnv } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
import { CommentModel } from "../src/infrastructure/database/models/Comment.js";
import { MoodModel } from "../src/infrastructure/database/models/Mood.js";
import { ReactionModel } from "../src/infrastructure/database/models/Reaction.js";
import { createLogger } from "../src/infrastructure/logging/logger.js";

const LEGACY_SLUGS = Object.keys(LEGACY_REACTION_SLUG_TO_EMOJI);
const LEGACY_SUMMARY_QUERY = {
  $or: LEGACY_SLUGS.map((slug) => ({
    [`reactionSummary.${slug}`]: { $exists: true },
  })),
};
const OLD_REACTION_INDEX = "userId_1_targetType_1_targetId_1";
const EMOJI_UNIQUE_INDEX = "userId_1_targetType_1_targetId_1_emoji_1";

function remapSummary(summary: Record<string, number>): Record<string, number> {
  const next: Record<string, number> = {};
  for (const [key, count] of Object.entries(summary ?? {})) {
    const emoji =
      LEGACY_REACTION_SLUG_TO_EMOJI[key as keyof typeof LEGACY_REACTION_SLUG_TO_EMOJI] ?? key;
    next[emoji] = (next[emoji] ?? 0) + count;
  }
  return next;
}

async function migrateReactionDocuments(logger: ReturnType<typeof createLogger>): Promise<{
  updated: number;
  skipped: number;
}> {
  let updated = 0;
  let skipped = 0;

  const cursor = ReactionModel.find({
    reactionType: { $exists: true },
    emoji: { $exists: false },
  }).cursor();

  for await (const reaction of cursor) {
    const slug = String(reaction.get("reactionType"));
    const emoji =
      LEGACY_REACTION_SLUG_TO_EMOJI[slug as keyof typeof LEGACY_REACTION_SLUG_TO_EMOJI];

    if (!emoji) {
      logger.warn("Unknown reaction slug, skipping reaction document", {
        reactionId: reaction._id.toString(),
        slug,
      });
      skipped += 1;
      continue;
    }

    await ReactionModel.updateOne(
      { _id: reaction._id },
      { $set: { emoji }, $unset: { reactionType: "" } },
    );
    updated += 1;
  }

  return { updated, skipped };
}

async function migrateSummaries(
  model: Model<{ reactionSummary?: Record<string, number> }>,
): Promise<number> {
  let updated = 0;
  const cursor = model.find(LEGACY_SUMMARY_QUERY).select("reactionSummary").cursor();

  for await (const doc of cursor) {
    const summary = (doc.reactionSummary ?? {}) as Record<string, number>;
    await model.updateOne({ _id: doc._id }, { $set: { reactionSummary: remapSummary(summary) } });
    updated += 1;
  }

  return updated;
}

async function swapReactionIndexes(logger: ReturnType<typeof createLogger>): Promise<void> {
  const indexes = await ReactionModel.collection.indexes();
  const hasOldIndex = indexes.some((index) => index.name === OLD_REACTION_INDEX);

  if (hasOldIndex) {
    await ReactionModel.collection.dropIndex(OLD_REACTION_INDEX);
    logger.info("Dropped legacy reaction index", { name: OLD_REACTION_INDEX });
  }

  await ReactionModel.syncIndexes();

  const syncedIndexes = await ReactionModel.collection.indexes();
  const hasEmojiUniqueIndex = syncedIndexes.some(
    (index) => index.name === EMOJI_UNIQUE_INDEX && index.unique === true,
  );

  if (!hasEmojiUniqueIndex) {
    throw new Error(`Failed to ensure unique index ${EMOJI_UNIQUE_INDEX}`);
  }

  logger.info("Reaction indexes synced", { ensured: EMOJI_UNIQUE_INDEX });
}

async function migrateReactionEmojis(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);

  await connectDatabase(env.MONGODB_URI, logger);

  const [reactions, moodsUpdated, commentsUpdated] = await Promise.all([
    migrateReactionDocuments(logger),
    migrateSummaries(MoodModel),
    migrateSummaries(CommentModel),
  ]);

  await swapReactionIndexes(logger);

  logger.info("Reaction emoji migration completed", {
    reactionsUpdated: reactions.updated,
    reactionsSkipped: reactions.skipped,
    moodsUpdated,
    commentsUpdated,
  });

  await disconnectDatabase();
}

migrateReactionEmojis().catch((error) => {
  console.error("Reaction emoji migration failed:", error);
  process.exit(1);
});
