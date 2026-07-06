import mongoose from "mongoose";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../../src/app.js";
import { createDependencies, type AppDependencies } from "../../src/config/di.js";
import { loadEnv } from "../../src/config/env.js";
import { AuditLogModel } from "../../src/infrastructure/database/models/AuditLog.js";
import { BookmarkModel } from "../../src/infrastructure/database/models/Bookmark.js";
import { CommentModel } from "../../src/infrastructure/database/models/Comment.js";
import { DailyStatisticsModel } from "../../src/infrastructure/database/models/DailyStatistics.js";
import { EmotionStatisticsModel } from "../../src/infrastructure/database/models/EmotionStatistics.js";
import { MoodImageModel } from "../../src/infrastructure/database/models/MoodImage.js";
import { MoodModel } from "../../src/infrastructure/database/models/Mood.js";
import { MoodTagModel } from "../../src/infrastructure/database/models/MoodTag.js";
import { NotificationModel } from "../../src/infrastructure/database/models/Notification.js";
import { ReactionModel } from "../../src/infrastructure/database/models/Reaction.js";
import { ReportModel } from "../../src/infrastructure/database/models/Report.js";
import { TagModel } from "../../src/infrastructure/database/models/Tag.js";
import { UserModel } from "../../src/infrastructure/database/models/User.js";

export const TEST_MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/motm_integration_test";

const emotionTags = [
  { name: "Stress", slug: "stress", colorToken: "emotion-stress", iconKey: "stress", sortOrder: 1 },
  { name: "Joy", slug: "joy", colorToken: "emotion-joy", iconKey: "joy", sortOrder: 2 },
];

export interface IntegrationContext {
  env: ReturnType<typeof loadEnv>;
  deps: AppDependencies;
  app: Express;
}

export function createIntegrationContext(): IntegrationContext {
  const env = loadEnv({
    ...process.env,
    NODE_ENV: "test",
    MONGODB_URI: TEST_MONGODB_URI,
    JWT_SECRET: "integration-test-jwt-secret",
    JWT_REFRESH_SECRET: "integration-test-refresh-secret",
    LOG_LEVEL: "error",
    RATE_LIMIT_AUTH_MAX: "1000",
    RATE_LIMIT_WRITE_MAX: "1000",
    RATE_LIMIT_FEED_MAX: "1000",
    RATE_LIMIT_GENERAL_MAX: "1000",
  });
  const deps = createDependencies(env);
  const app = createApp(deps);

  return { env, deps, app };
}

export async function connectIntegrationDatabase(deps: AppDependencies): Promise<void> {
  await deps.database.connect();
}

export async function disconnectIntegrationDatabase(deps: AppDependencies): Promise<void> {
  await deps.database.disconnect();
}

export async function isMongoAvailable(): Promise<boolean> {
  try {
    await mongoose.connect(TEST_MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    await mongoose.disconnect();
    return true;
  } catch {
    return false;
  }
}

export async function seedReferenceData(): Promise<{ stressTagId: string }> {
  for (const tag of emotionTags) {
    await TagModel.findOneAndUpdate(
      { type: "emotion", slug: tag.slug },
      {
        name: tag.name,
        slug: tag.slug,
        type: "emotion",
        colorToken: tag.colorToken,
        iconKey: tag.iconKey,
        isActive: true,
        sortOrder: tag.sortOrder,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }

  const stressTag = await TagModel.findOne({ type: "emotion", slug: "stress" }).lean();
  if (!stressTag) {
    throw new Error("Failed to seed stress tag");
  }

  return { stressTagId: stressTag._id.toString() };
}

export async function clearTransactionalData(): Promise<void> {
  await Promise.all([
    UserModel.deleteMany({}),
    MoodModel.deleteMany({}),
    MoodTagModel.deleteMany({}),
    MoodImageModel.deleteMany({}),
    CommentModel.deleteMany({}),
    ReactionModel.deleteMany({}),
    BookmarkModel.deleteMany({}),
    ReportModel.deleteMany({}),
    NotificationModel.deleteMany({}),
    AuditLogModel.deleteMany({}),
    EmotionStatisticsModel.deleteMany({}),
    DailyStatisticsModel.deleteMany({}),
  ]);
}

export async function registerStudent(
  app: Express,
  email: string,
  password = "TestPass1",
): Promise<{ accessToken: string; userId: string }> {
  const response = await request(app).post("/api/v1/auth/register").send({ email, password });

  if (response.status !== 201 || !response.body.success) {
    throw new Error(
      `registerStudent failed for ${email}: ${response.status} ${JSON.stringify(response.body)}`,
    );
  }

  return {
    accessToken: response.body.data.tokens.accessToken as string,
    userId: response.body.data.user.id as string,
  };
}

export async function promoteUserToAdmin(email: string): Promise<void> {
  await UserModel.findOneAndUpdate(
    { email: email.toLowerCase(), deletedAt: null },
    { role: "administrator" },
  );
}
