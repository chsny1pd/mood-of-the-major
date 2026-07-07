import "dotenv/config";
import { loadEnv } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
import { createLogger } from "../src/infrastructure/logging/logger.js";
import { BcryptPasswordHasher } from "../src/infrastructure/auth/BcryptPasswordHasher.js";
import { FacultyModel } from "../src/infrastructure/database/models/Faculty.js";
import { MajorModel } from "../src/infrastructure/database/models/Major.js";
import { MoodModel } from "../src/infrastructure/database/models/Mood.js";
import { MoodTagModel } from "../src/infrastructure/database/models/MoodTag.js";
import { TagModel } from "../src/infrastructure/database/models/Tag.js";
import { UserModel } from "../src/infrastructure/database/models/User.js";

const SAMPLE_USER_EMAIL = "stats-demo@moodofthemajor.test";

const moodSamples = [
  { content: "Midterms are stacking up.", tagSlug: "stress", dayOffset: 1 },
  { content: "Finished a group project on time.", tagSlug: "joy", dayOffset: 2 },
  { content: "Presentation tomorrow — nervous.", tagSlug: "anxiety", dayOffset: 3 },
  { content: "Grateful for study buddies.", tagSlug: "gratitude", dayOffset: 4 },
  { content: "Lab report deadline stress.", tagSlug: "stress", dayOffset: 5 },
  { content: "Got helpful feedback from a tutor.", tagSlug: "gratitude", dayOffset: 6 },
  { content: "Campus event lifted my mood.", tagSlug: "joy", dayOffset: 7 },
  { content: "Waiting on internship results.", tagSlug: "anxiety", dayOffset: 8 },
  { content: "Morning coffee and a quiet library.", tagSlug: "joy", dayOffset: 9 },
  { content: "End-of-semester crunch.", tagSlug: "stress", dayOffset: 10 },
] as const;

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(12, 0, 0, 0);
  return date;
}

async function seedSampleMoods(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);

  await connectDatabase(env.MONGODB_URI, logger);

  const faculty = await FacultyModel.findOne({ slug: "kmitl-engineering" }).lean();
  const major = faculty
    ? await MajorModel.findOne({
        facultyId: faculty._id,
        slug: "bachelor-of-engineering-program-in-computer-engineering",
      }).lean()
    : null;

  if (!faculty || !major) {
    throw new Error("Run npm run seed first — KMITL engineering reference data missing.");
  }

  const tags = await TagModel.find({ type: "emotion", isActive: true }).lean();
  const tagBySlug = new Map(tags.map((tag) => [tag.slug, tag]));

  for (const slug of ["stress", "joy", "anxiety", "gratitude"]) {
    if (!tagBySlug.has(slug)) {
      throw new Error(`Emotion tag "${slug}" missing — run npm run seed first.`);
    }
  }

  const hasher = new BcryptPasswordHasher(env.BCRYPT_ROUNDS);
  let user = await UserModel.findOne({ email: SAMPLE_USER_EMAIL, deletedAt: null });

  if (!user) {
    user = await UserModel.create({
      email: SAMPLE_USER_EMAIL,
      passwordHash: await hasher.hash("SampleMoods123!"),
      role: "student",
      facultyId: faculty._id,
      majorId: major._id,
      status: "active",
      tokenVersion: 0,
    });
    logger.info("Created sample user", { email: SAMPLE_USER_EMAIL });
  }

  const existingCount = await MoodModel.countDocuments({
    authorId: user._id,
    status: "active",
    deletedAt: null,
  });

  if (existingCount >= moodSamples.length) {
    logger.info("Sample moods already present", { count: existingCount });
    await disconnectDatabase();
    return;
  }

  let created = 0;

  for (const sample of moodSamples) {
    const tag = tagBySlug.get(sample.tagSlug)!;
    const createdAt = daysAgo(sample.dayOffset);

    const mood = await MoodModel.create({
      authorId: user._id,
      content: sample.content,
      facultyId: faculty._id,
      majorId: major._id,
      status: "active",
      primaryTagId: tag._id,
      commentCount: 0,
      reactionSummary: {},
      imageCount: 0,
      lastActivityAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    });

    await MoodTagModel.create({
      moodId: mood._id,
      tagId: tag._id,
      isPrimary: true,
      createdAt,
      updatedAt: createdAt,
    });

    created += 1;
  }

  logger.info("Sample moods seeded", {
    created,
    faculty: faculty.slug,
    major: major.slug,
    threshold: env.AGGREGATION_THRESHOLD_MIN,
  });

  await disconnectDatabase();
}

seedSampleMoods().catch((error) => {
  console.error("Sample mood seed failed:", error);
  process.exit(1);
});
