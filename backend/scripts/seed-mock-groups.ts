import "dotenv/config";
import { randomInt } from "node:crypto";
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
import { GroupModel } from "../src/infrastructure/database/models/Group.js";
import { GroupMemberModel } from "../src/infrastructure/database/models/GroupMember.js";
import type { Types } from "mongoose";

const MOCK_EMAIL_DOMAIN = "moodofthemajor.test";
const MOCK_STUDENT_COUNT = 50;
const MOCK_GROUP_MARKER = "mock-groups-v1";

const groupTemplates = [
  {
    name: "Finals Survival Circle",
    description: `Anonymous space for exam stress, all-nighters, and small wins. [${MOCK_GROUP_MARKER}]`,
    coverImageUrl: "https://picsum.photos/seed/motm-finals/960/540",
    moodContents: [
      { content: "Three exams in two days. My brain is soup.", tagSlug: "stress" },
      { content: "Finished one paper early — celebrating quietly.", tagSlug: "joy" },
      { content: "Can't sleep before tomorrow's midterm.", tagSlug: "anxiety" },
    ],
  },
  {
    name: "Internship Interview Support",
    description: `Share interview nerves and prep tips without judgment. [${MOCK_GROUP_MARKER}]`,
    coverImageUrl: "https://picsum.photos/seed/motm-intern/960/540",
    moodContents: [
      { content: "Behavioral interview tomorrow. Hands keep shaking.", tagSlug: "anxiety" },
      { content: "Got a callback — still can't believe it.", tagSlug: "joy" },
      { content: "Grateful for seniors who shared their interview notes.", tagSlug: "gratitude" },
    ],
  },
  {
    name: "Quiet Library Grind",
    description: `For people who just need company while studying. [${MOCK_GROUP_MARKER}]`,
    coverImageUrl: "https://picsum.photos/seed/motm-library/960/540",
    moodContents: [
      { content: "Found a perfect corner on floor 4. Peace at last.", tagSlug: "joy" },
      { content: "Too many tabs open and not enough focus.", tagSlug: "stress" },
    ],
  },
  {
    name: "First-Year Feelings",
    description: `Orientation overwhelm, new friends, homesick nights. [${MOCK_GROUP_MARKER}]`,
    coverImageUrl: "https://picsum.photos/seed/motm-firstyear/960/540",
    moodContents: [
      { content: "Everyone seems to know where they're going except me.", tagSlug: "anxiety" },
      { content: "A classmate said hi first — that meant a lot.", tagSlug: "gratitude" },
      { content: "Missing home more than I expected.", tagSlug: "stress" },
    ],
  },
  {
    name: "Lab Report Late Nights",
    description: `Engineering and science students venting about reports and labs. [${MOCK_GROUP_MARKER}]`,
    coverImageUrl: "https://picsum.photos/seed/motm-lab/960/540",
    moodContents: [
      { content: "Lab data looks wrong and the deadline is tonight.", tagSlug: "stress" },
      { content: "Finally got the apparatus to work after two hours.", tagSlug: "joy" },
    ],
  },
  {
    name: "Gratitude Corner",
    description: `Small thank-yous and soft moments from campus life. [${MOCK_GROUP_MARKER}]`,
    coverImageUrl: "https://picsum.photos/seed/motm-gratitude/960/540",
    moodContents: [
      { content: "Tutor stayed late to explain recursion again.", tagSlug: "gratitude" },
      { content: "Free coffee at the student lounge made my morning.", tagSlug: "joy" },
      { content: "Friend shared notes when I was sick. Thank you.", tagSlug: "gratitude" },
    ],
  },
  {
    name: "Anxiety Check-In",
    description: `A calmer room when thoughts race. No advice required — just presence. [${MOCK_GROUP_MARKER}]`,
    coverImageUrl: "https://picsum.photos/seed/motm-anxiety/960/540",
    moodContents: [
      { content: "Heart racing before every presentation.", tagSlug: "anxiety" },
      { content: "Breathing exercise helped a little today.", tagSlug: "gratitude" },
    ],
  },
  {
    name: "Weekend Recharge",
    description: `Rest plans, soft hobbies, and recovering from the week. [${MOCK_GROUP_MARKER}]`,
    coverImageUrl: "https://picsum.photos/seed/motm-weekend/960/540",
    moodContents: [
      { content: "Did nothing productive and it felt necessary.", tagSlug: "joy" },
      { content: "Still thinking about Monday's deadlines on Saturday.", tagSlug: "stress" },
    ],
  },
] as const;

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

function daysAgo(days: number, hour = 12): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, randomInt(0, 59), randomInt(0, 59), 0);
  return date;
}

async function ensureMockStudents(
  hasher: BcryptPasswordHasher,
): Promise<Types.ObjectId[]> {
  const faculties = await FacultyModel.find({ isActive: true }).lean();
  const affiliations: Array<{ facultyId: Types.ObjectId; majorId: Types.ObjectId }> = [];

  for (const faculty of faculties) {
    const majors = await MajorModel.find({ facultyId: faculty._id, isActive: true }).lean();
    for (const major of majors) {
      affiliations.push({ facultyId: faculty._id, majorId: major._id });
    }
  }

  if (affiliations.length === 0) {
    throw new Error("Run npm run seed first — faculties and majors are missing.");
  }

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
        displayName: `Mock Student ${i}`,
        tokenVersion: 0,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    userIds.push(user._id);
  }

  return userIds;
}

async function clearPreviousMockGroups(): Promise<void> {
  const existing = await GroupModel.find({
    description: { $regex: MOCK_GROUP_MARKER, $options: "i" },
  }).lean();

  if (existing.length === 0) {
    return;
  }

  const groupIds = existing.map((group) => group._id);

  const groupMoods = await MoodModel.find({ groupId: { $in: groupIds } }).lean();
  const moodIds = groupMoods.map((mood) => mood._id);

  if (moodIds.length > 0) {
    await MoodTagModel.deleteMany({ moodId: { $in: moodIds } });
    await MoodModel.deleteMany({ _id: { $in: moodIds } });
  }

  await GroupMemberModel.deleteMany({ groupId: { $in: groupIds } });
  await GroupModel.deleteMany({ _id: { $in: groupIds } });
}

async function seedMockGroups(): Promise<void> {
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

  const hasher = new BcryptPasswordHasher(env.BCRYPT_ROUNDS);
  const studentIds = await ensureMockStudents(hasher);

  await clearPreviousMockGroups();

  let groupsCreated = 0;
  let membersCreated = 0;
  let moodsCreated = 0;

  for (const [index, template] of groupTemplates.entries()) {
    const ownerId = studentIds[index % studentIds.length]!;
    const createdAt = daysAgo(randomInt(3, 30));

    const group = await GroupModel.create({
      name: template.name,
      description: template.description,
      coverImageUrl: template.coverImageUrl,
      ownerId,
      memberCount: 1,
      status: "active",
      createdAt,
      updatedAt: createdAt,
    });

    await GroupMemberModel.create({
      groupId: group._id,
      userId: ownerId,
      role: "owner",
      joinedAt: createdAt,
    });
    membersCreated += 1;

    const extraMembers = pickMany(
      studentIds.filter((id) => !id.equals(ownerId)),
      randomInt(8, 22),
    );

    for (const userId of extraMembers) {
      await GroupMemberModel.create({
        groupId: group._id,
        userId,
        role: "member",
        joinedAt: daysAgo(randomInt(0, 20)),
      });
      membersCreated += 1;
    }

    await GroupModel.updateOne(
      { _id: group._id },
      { memberCount: 1 + extraMembers.length },
    );

    const memberPool = [ownerId, ...extraMembers];

    for (const moodTemplate of template.moodContents) {
      const tag = tagBySlug.get(moodTemplate.tagSlug)!;
      const authorId = pickOne(memberPool);
      const moodAt = daysAgo(randomInt(0, 14));

      const mood = await MoodModel.create({
        authorId,
        content: `${moodTemplate.content} [${MOCK_GROUP_MARKER}]`,
        facultyId: null,
        majorId: null,
        groupId: group._id,
        status: "active",
        primaryTagId: tag._id,
        commentCount: 0,
        reactionSummary: {},
        imageCount: 0,
        reportCount: 0,
        lastActivityAt: moodAt,
        createdAt: moodAt,
        updatedAt: moodAt,
      });

      await MoodTagModel.create({
        moodId: mood._id,
        tagId: tag._id,
        isPrimary: true,
        createdAt: moodAt,
        updatedAt: moodAt,
      });

      moodsCreated += 1;
    }

    groupsCreated += 1;
  }

  logger.info("Mock groups seeded", {
    groups: groupsCreated,
    members: membersCreated,
    moods: moodsCreated,
    loginHint: `mock-student-01@${MOCK_EMAIL_DOMAIN} / MockStudent123!`,
  });

  await disconnectDatabase();
}

seedMockGroups().catch(async (error: unknown) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exitCode = 1;
});
