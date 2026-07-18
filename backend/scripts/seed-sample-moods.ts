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
/** Enough moods for CE major to pass AGGREGATION_THRESHOLD_MIN (default 5) with headroom. */
const TARGET_MAJOR_MOOD_COUNT = 40;

const moodTemplates = [
  { content: "Midterms are stacking up.", tagSlug: "stress" },
  { content: "Finished a group project on time.", tagSlug: "joy" },
  { content: "Presentation tomorrow — nervous.", tagSlug: "anxiety" },
  { content: "Grateful for study buddies.", tagSlug: "gratitude" },
  { content: "Lab report deadline stress.", tagSlug: "stress" },
  { content: "Got helpful feedback from a tutor.", tagSlug: "gratitude" },
  { content: "Campus event lifted my mood.", tagSlug: "joy" },
  { content: "Waiting on internship results.", tagSlug: "anxiety" },
  { content: "Morning coffee and a quiet library.", tagSlug: "joy" },
  { content: "End-of-semester crunch.", tagSlug: "stress" },
  { content: "Debugging all night for the CE project.", tagSlug: "stress" },
  { content: "Passed the algorithms quiz!", tagSlug: "joy" },
  { content: "Nervous about the hardware lab viva.", tagSlug: "anxiety" },
  { content: "Thankful for senior mentoring hours.", tagSlug: "gratitude" },
  { content: "Too many pull requests to review today.", tagSlug: "stress" },
  { content: "Team demo went better than expected.", tagSlug: "joy" },
  { content: "Waiting on compiler error #47.", tagSlug: "anxiety" },
  { content: "Appreciate quiet study rooms in Engineering.", tagSlug: "gratitude" },
  { content: "Circuits homework is eating my weekend.", tagSlug: "stress" },
  { content: "Solved a bug that blocked the whole team.", tagSlug: "joy" },
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
    majorId: major._id,
    status: "active",
    deletedAt: null,
  });

  if (existingCount >= TARGET_MAJOR_MOOD_COUNT) {
    logger.info("CE sample moods already sufficient", { count: existingCount, target: TARGET_MAJOR_MOOD_COUNT });
    await disconnectDatabase();
    return;
  }

  const toCreate = TARGET_MAJOR_MOOD_COUNT - existingCount;
  let created = 0;

  for (let i = 0; i < toCreate; i += 1) {
    const template = moodTemplates[i % moodTemplates.length]!;
    const tag = tagBySlug.get(template.tagSlug)!;
    const createdAt = daysAgo((i % 28) + 1);

    const mood = await MoodModel.create({
      authorId: user._id,
      content: `${template.content} [ce-sample-${existingCount + i + 1}]`,
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

  logger.info("Sample moods seeded for Computer Engineering", {
    created,
    previous: existingCount,
    totalTarget: TARGET_MAJOR_MOOD_COUNT,
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
