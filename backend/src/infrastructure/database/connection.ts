import mongoose from "mongoose";
import type { Logger } from "../logging/logger.js";
import { DailyStatisticsModel } from "./models/DailyStatistics.js";
import { EmotionStatisticsModel } from "./models/EmotionStatistics.js";
import { BookmarkModel } from "./models/Bookmark.js";
import { CommentModel } from "./models/Comment.js";
import { MoodModel } from "./models/Mood.js";
import { ReactionModel } from "./models/Reaction.js";
import { ReportModel } from "./models/Report.js";

export type DatabaseStatus = "disconnected" | "connecting" | "connected" | "disconnecting";

async function syncModelIndexes(logger: Logger): Promise<void> {
  await Promise.all([
    MoodModel.syncIndexes(),
    CommentModel.syncIndexes(),
    ReactionModel.syncIndexes(),
    BookmarkModel.syncIndexes(),
    ReportModel.syncIndexes(),
    EmotionStatisticsModel.syncIndexes(),
    DailyStatisticsModel.syncIndexes(),
  ]);
  logger.info("MongoDB indexes synced");
}

export async function connectDatabase(uri: string, logger: Logger): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  logger.info("Connecting to MongoDB...");
  await mongoose.connect(uri);
  await syncModelIndexes(logger);
  logger.info("MongoDB connected");
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
}

export function getDatabaseStatus(): DatabaseStatus {
  const states: DatabaseStatus[] = [
    "disconnected",
    "connected",
    "connecting",
    "disconnecting",
  ];

  return states[mongoose.connection.readyState] ?? "disconnected";
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}
