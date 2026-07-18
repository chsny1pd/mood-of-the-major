import "dotenv/config";
import { randomInt } from "node:crypto";
import { loadEnv } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
import { createLogger } from "../src/infrastructure/logging/logger.js";
import { BcryptPasswordHasher } from "../src/infrastructure/auth/BcryptPasswordHasher.js";
import { REACTION_TYPES } from "../src/domain/constants/engagementConstants.js";
import { FacultyModel } from "../src/infrastructure/database/models/Faculty.js";
import { MajorModel } from "../src/infrastructure/database/models/Major.js";
import { MoodModel } from "../src/infrastructure/database/models/Mood.js";
import { MoodTagModel } from "../src/infrastructure/database/models/MoodTag.js";
import { TagModel } from "../src/infrastructure/database/models/Tag.js";
import { UserModel } from "../src/infrastructure/database/models/User.js";
import { CommentModel } from "../src/infrastructure/database/models/Comment.js";
import { ReactionModel } from "../src/infrastructure/database/models/Reaction.js";
import { ReportModel } from "../src/infrastructure/database/models/Report.js";
import type { Types } from "mongoose";

const MOCK_EMAIL_DOMAIN = "moodofthemajor.test";
const MOCK_STUDENT_COUNT = 50;
const TARGET_MOOD_COUNT = 500;
const MOCK_MARKER = "mock-data-v2";

const moodTemplates = [
  { content: "Midterms are stacking up and I barely slept.", tagSlug: "stress" },
  { content: "Finished a group project on time — huge relief.", tagSlug: "joy" },
  { content: "Presentation tomorrow and my hands won't stop shaking.", tagSlug: "anxiety" },
  { content: "Grateful for study buddies who explain things patiently.", tagSlug: "gratitude" },
  { content: "Lab report deadline is crushing me this week.", tagSlug: "stress" },
  { content: "Got helpful feedback from a tutor today.", tagSlug: "gratitude" },
  { content: "Campus event lifted my mood after a rough morning.", tagSlug: "joy" },
  { content: "Waiting on internship interview results.", tagSlug: "anxiety" },
  { content: "Morning coffee and a quiet corner in the library.", tagSlug: "joy" },
  { content: "End-of-semester crunch — everyone looks tired.", tagSlug: "stress" },
  { content: "A friend checked in when I needed it most.", tagSlug: "gratitude" },
  { content: "Public speaking class is harder than I expected.", tagSlug: "anxiety" },
  { content: "Finally understood a concept I'd struggled with for weeks.", tagSlug: "joy" },
  { content: "Too many assignments due the same day again.", tagSlug: "stress" },
  { content: "Thankful for professors who stay after class.", tagSlug: "gratitude" },
  { content: "Career fair tomorrow — nervous but excited.", tagSlug: "anxiety" },
  { content: "Study group turned into a good laugh session.", tagSlug: "joy" },
  { content: "Feeling behind compared to classmates.", tagSlug: "stress" },
  { content: "Small win: submitted everything before midnight.", tagSlug: "joy" },
  { content: "Appreciating quiet weekends to recharge.", tagSlug: "gratitude" },
] as const;

const commentTemplates = [
  "Same here — you're not alone.",
  "Hang in there, this week is almost over.",
  "That sounds tough. Hope it gets easier.",
  "Nice work pushing through!",
  "Sending support from the library grind.",
  "I felt this yesterday too.",
  "Thanks for sharing — it helps to know others feel this way.",
  "You've got this!",
  "Rooting for you.",
  "Take a break if you can — rest counts.",
] as const;

const reportReasons = ["spam", "harassment", "other"] as const;

interface Affiliation {
  facultyId: Types.ObjectId;
  majorId: Types.ObjectId;
}

function daysAgo(days: number, hour = 12): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, randomInt(0, 59), randomInt(0, 59), 0);
  return date;
}

function pickOne<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length)]!;
}

function pickMany<T>(items: readonly T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const index = randomInt(0, pool.length);
    picked.push(pool.splice(index, 1)[0]!);
  }
  return picked;
}

async function loadAffiliations(): Promise<Affiliation[]> {
  const faculties = await FacultyModel.find({ isActive: true }).lean();
  const affiliations: Affiliation[] = [];

  for (const faculty of faculties) {
    const majors = await MajorModel.find({ facultyId: faculty._id, isActive: true }).lean();
    for (const major of majors) {
      affiliations.push({ facultyId: faculty._id, majorId: major._id });
    }
  }

  if (affiliations.length === 0) {
    throw new Error("Run npm run seed first — faculties and majors are missing.");
  }

  return affiliations;
}

async function ensureMockStudents(
  affiliations: Affiliation[],
  hasher: BcryptPasswordHasher,
): Promise<Types.ObjectId[]> {
  const passwordHash = await hasher.hash("MockStudent123!");
  const userIds: Types.ObjectId[] = [];

  for (let i = 1; i <= MOCK_STUDENT_COUNT; i += 1) {
    const email = `mock-student-${String(i).padStart(2, "0")}@${MOCK_EMAIL_DOMAIN}`;
    const affiliation = affiliations[(i - 1) % affiliations.length]!;
    const studentId = `MK${String(i).padStart(6, "0")}`;

    const user = await UserModel.findOneAndUpdate(
      { email, deletedAt: null },
      {
        email,
        passwordHash,
        role: "student",
        facultyId: affiliation.facultyId,
        majorId: affiliation.majorId,
        studentId,
        yearOfStudy: (i % 4) + 1,
        status: "active",
        tokenVersion: 0,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    userIds.push(user._id);
  }

  return userIds;
}

async function seedMockData(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);

  await connectDatabase(env.MONGODB_URI, logger);

  const tags = await TagModel.find({ type: "emotion", isActive: true }).lean();
  const tagBySlug = new Map(tags.map((tag) => [tag.slug, tag]));

  for (const slug of ["stress", "joy", "anxiety", "gratitude"]) {
    if (!tagBySlug.has(slug)) {
      throw new Error(`Emotion tag "${slug}" missing — run npm run seed first.`);
    }
  }

  const affiliations = await loadAffiliations();
  const hasher = new BcryptPasswordHasher(env.BCRYPT_ROUNDS);
  const studentIds = await ensureMockStudents(affiliations, hasher);

  const existingMockMoods = await MoodModel.countDocuments({
    content: { $regex: MOCK_MARKER, $options: "i" },
    deletedAt: null,
  });

  if (existingMockMoods >= TARGET_MOOD_COUNT) {
    logger.info("Mock data already present", { moods: existingMockMoods });
    await disconnectDatabase();
    return;
  }

  const moodsToCreate = TARGET_MOOD_COUNT - existingMockMoods;
  let moodsCreated = 0;
  let commentsCreated = 0;
  let reactionsCreated = 0;
  let reportsCreated = 0;

  const createdMoodIds: Types.ObjectId[] = [];

  for (let i = 0; i < moodsToCreate; i += 1) {
    const template = moodTemplates[i % moodTemplates.length]!;
    const tag = tagBySlug.get(template.tagSlug)!;
    const authorId = pickOne(studentIds);
    const affiliation = pickOne(affiliations);
    const dayOffset = randomInt(0, 44);
    const createdAt = daysAgo(dayOffset);

    const mood = await MoodModel.create({
      authorId,
      content: `${template.content} [${MOCK_MARKER}]`,
      facultyId: affiliation.facultyId,
      majorId: affiliation.majorId,
      status: "active",
      primaryTagId: tag._id,
      commentCount: 0,
      reactionSummary: {},
      imageCount: 0,
      reportCount: 0,
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

    createdMoodIds.push(mood._id);
    moodsCreated += 1;

    const reactionUsers = pickMany(studentIds, randomInt(1, 6));
    const reactionSummary: Record<string, number> = {};

    for (const userId of reactionUsers) {
      if (userId.equals(authorId)) {
        continue;
      }

      const reactionType = pickOne(REACTION_TYPES);
      try {
        await ReactionModel.create({
          userId,
          targetType: "mood",
          targetId: mood._id,
          reactionType,
          createdAt,
          updatedAt: createdAt,
        });
        reactionSummary[reactionType] = (reactionSummary[reactionType] ?? 0) + 1;
        reactionsCreated += 1;
      } catch {
        // duplicate reaction for same user/target — skip
      }
    }

    if (Object.keys(reactionSummary).length > 0) {
      await MoodModel.updateOne({ _id: mood._id }, { reactionSummary });
    }

    if (randomInt(0, 100) < 42) {
      const commentCount = randomInt(1, 4);
      let moodCommentCount = 0;

      for (let c = 0; c < commentCount; c += 1) {
        const commentAuthor = pickOne(studentIds);
        const commentAt = new Date(createdAt.getTime() + (c + 1) * 3600_000);

        const comment = await CommentModel.create({
          moodId: mood._id,
          authorId: commentAuthor,
          parentId: null,
          content: pickOne(commentTemplates),
          status: "active",
          reactionSummary: {},
          depth: 0,
          createdAt: commentAt,
          updatedAt: commentAt,
        });

        moodCommentCount += 1;
        commentsCreated += 1;

        if (randomInt(0, 100) < 35) {
          const commentReactor = pickOne(studentIds);
          const reactionType = pickOne(REACTION_TYPES);
          try {
            await ReactionModel.create({
              userId: commentReactor,
              targetType: "comment",
              targetId: comment._id,
              reactionType,
              createdAt: commentAt,
              updatedAt: commentAt,
            });
            reactionsCreated += 1;
            await CommentModel.updateOne(
              { _id: comment._id },
              { reactionSummary: { [reactionType]: 1 } },
            );
          } catch {
            // skip duplicate
          }
        }
      }

      await MoodModel.updateOne(
        { _id: mood._id },
        { commentCount: moodCommentCount, lastActivityAt: daysAgo(Math.max(0, dayOffset - 1)) },
      );
    }
  }

  const reportCandidates = pickMany(createdMoodIds, Math.min(12, createdMoodIds.length));
  for (const moodId of reportCandidates) {
    const reporterId = pickOne(studentIds);
    const mood = await MoodModel.findById(moodId).lean();
    if (!mood) {
      continue;
    }

    const existingReport = await ReportModel.findOne({
      reporterId,
      targetType: "mood",
      targetId: moodId,
    }).lean();

    if (existingReport) {
      continue;
    }

    await ReportModel.create({
      reporterId,
      targetType: "mood",
      targetId: moodId,
      reasonCode: pickOne(reportReasons),
      description: "Flagged during mock seed for admin queue demo.",
      status: "pending",
    });

    await MoodModel.updateOne({ _id: moodId }, { $inc: { reportCount: 1 } });
    reportsCreated += 1;
  }

  logger.info("Mock data seeded", {
    students: MOCK_STUDENT_COUNT,
    moodsCreated,
    commentsCreated,
    reactionsCreated,
    reportsCreated,
    threshold: env.AGGREGATION_THRESHOLD_MIN,
  });

  await disconnectDatabase();
}

seedMockData().catch((error) => {
  console.error("Mock data seed failed:", error);
  process.exit(1);
});
