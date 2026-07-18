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
const TESTER_EMAIL = "setsin2549@gmail.com";
const TESTER_JOIN_COUNT = 12;

type MoodTemplate = { content: string; tagSlug: string };
type GroupTemplate = {
  name: string;
  description: string;
  coverSeed: string;
  moodContents: MoodTemplate[];
};

const groupTemplates: GroupTemplate[] = [
  {
    name: "Finals Survival Circle",
    description: `Anonymous space for exam stress, all-nighters, and small wins. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-finals",
    moodContents: [
      { content: "Three exams in two days. My brain is soup.", tagSlug: "stress" },
      { content: "Finished one paper early — celebrating quietly.", tagSlug: "joy" },
      { content: "Can't sleep before tomorrow's midterm.", tagSlug: "anxiety" },
    ],
  },
  {
    name: "Internship Interview Support",
    description: `Share interview nerves and prep tips without judgment. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-intern",
    moodContents: [
      { content: "Behavioral interview tomorrow. Hands keep shaking.", tagSlug: "anxiety" },
      { content: "Got a callback — still can't believe it.", tagSlug: "joy" },
      { content: "Grateful for seniors who shared their interview notes.", tagSlug: "gratitude" },
    ],
  },
  {
    name: "Quiet Library Grind",
    description: `For people who just need company while studying. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-library",
    moodContents: [
      { content: "Found a perfect corner on floor 4. Peace at last.", tagSlug: "joy" },
      { content: "Too many tabs open and not enough focus.", tagSlug: "stress" },
    ],
  },
  {
    name: "First-Year Feelings",
    description: `Orientation overwhelm, new friends, homesick nights. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-firstyear",
    moodContents: [
      { content: "Everyone seems to know where they're going except me.", tagSlug: "anxiety" },
      { content: "A classmate said hi first — that meant a lot.", tagSlug: "gratitude" },
      { content: "Missing home more than I expected.", tagSlug: "stress" },
    ],
  },
  {
    name: "Lab Report Late Nights",
    description: `Engineering and science students venting about reports and labs. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-lab",
    moodContents: [
      { content: "Lab data looks wrong and the deadline is tonight.", tagSlug: "stress" },
      { content: "Finally got the apparatus to work after two hours.", tagSlug: "joy" },
    ],
  },
  {
    name: "Gratitude Corner",
    description: `Small thank-yous and soft moments from campus life. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-gratitude",
    moodContents: [
      { content: "Tutor stayed late to explain recursion again.", tagSlug: "gratitude" },
      { content: "Free coffee at the student lounge made my morning.", tagSlug: "joy" },
      { content: "Friend shared notes when I was sick. Thank you.", tagSlug: "gratitude" },
    ],
  },
  {
    name: "Anxiety Check-In",
    description: `A calmer room when thoughts race. No advice required — just presence. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-anxiety",
    moodContents: [
      { content: "Heart racing before every presentation.", tagSlug: "anxiety" },
      { content: "Breathing exercise helped a little today.", tagSlug: "gratitude" },
    ],
  },
  {
    name: "Weekend Recharge",
    description: `Rest plans, soft hobbies, and recovering from the week. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-weekend",
    moodContents: [
      { content: "Did nothing productive and it felt necessary.", tagSlug: "joy" },
      { content: "Still thinking about Monday's deadlines on Saturday.", tagSlug: "stress" },
    ],
  },
  {
    name: "Thesis & Capstone Talk",
    description: `Progress updates, writer's block, and advisor meetings. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-thesis",
    moodContents: [
      { content: "Advisor meeting left me more confused than before.", tagSlug: "stress" },
      { content: "Wrote 800 words today. Slow but real.", tagSlug: "joy" },
    ],
  },
  {
    name: "Campus Loneliness",
    description: `For days when the cafeteria feels too loud and too empty. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-lonely",
    moodContents: [
      { content: "Ate lunch alone again. It still stings a bit.", tagSlug: "stress" },
      { content: "Someone held the door and smiled. Tiny lift.", tagSlug: "gratitude" },
    ],
  },
  {
    name: "Morning Motivation",
    description: `Soft starts, coffee rituals, and getting out the door. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-morning",
    moodContents: [
      { content: "Made it to the 8am class. That counts.", tagSlug: "joy" },
      { content: "Snoozed too much. Day already feels behind.", tagSlug: "anxiety" },
    ],
  },
  {
    name: "Group Project Chaos",
    description: `Uneven workloads, silent teammates, and last-minute merges. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-project",
    moodContents: [
      { content: "Still waiting on two teammates with 12 hours left.", tagSlug: "stress" },
      { content: "We finally synced and finished the slide deck.", tagSlug: "joy" },
    ],
  },
  {
    name: "Sleep Debt Club",
    description: `Insomnia, naps between classes, and energy crashes. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-sleep",
    moodContents: [
      { content: "Four hours of sleep. Everything feels heavier.", tagSlug: "stress" },
      { content: "Afternoon nap saved me from zoning out in lecture.", tagSlug: "gratitude" },
    ],
  },
  {
    name: "Creative Break Room",
    description: `Drawing, music, writing — anything that isn't coursework. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-creative",
    moodContents: [
      { content: "Sketched for twenty minutes. Mood reset.", tagSlug: "joy" },
      { content: "Want to create but the to-do list won't quiet down.", tagSlug: "anxiety" },
    ],
  },
  {
    name: "Money & Part-Time Stress",
    description: `Tuition, shifts, and stretching a student budget. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-money",
    moodContents: [
      { content: "Shift after class again. Exhausted but needed.", tagSlug: "stress" },
      { content: "Got paid today — breathing room for a week.", tagSlug: "joy" },
    ],
  },
  {
    name: "Friend Drama Buffer",
    description: `Awkward silence, drifting friendships, and repair attempts. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-friends",
    moodContents: [
      { content: "Haven't talked to my roommate in three days.", tagSlug: "anxiety" },
      { content: "We cleared the air. Feels lighter.", tagSlug: "gratitude" },
    ],
  },
  {
    name: "Fitness Soft Start",
    description: `Walks, gym anxiety, and celebrating showing up. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-fitness",
    moodContents: [
      { content: "Walked around campus twice. Clearer head.", tagSlug: "joy" },
      { content: "Skipped the gym again and feel guilty.", tagSlug: "stress" },
    ],
  },
  {
    name: "Coding Bug Night",
    description: `Stack traces, rubber ducks, and 2am 'it works'. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-coding",
    moodContents: [
      { content: "Bug was a missing semicolon. I want to scream.", tagSlug: "stress" },
      { content: "Tests are green. Going to sleep as a champion.", tagSlug: "joy" },
    ],
  },
  {
    name: "Homesick Soft Space",
    description: `Missing family meals, hometown weather, and familiar streets. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-home",
    moodContents: [
      { content: "Called home and felt better for an hour.", tagSlug: "gratitude" },
      { content: "Festival at home tonight and I'm stuck in the dorm.", tagSlug: "stress" },
    ],
  },
  {
    name: "After-Class Decompress",
    description: `Unload the day before dinner. Short posts welcome. [${MOCK_GROUP_MARKER}]`,
    coverSeed: "motm-afterclass",
    moodContents: [
      { content: "Lecture was dense but I took decent notes.", tagSlug: "joy" },
      { content: "Social battery emptied by 4pm.", tagSlug: "anxiety" },
    ],
  },
];

function coverUrl(seed: string): string {
  return `https://picsum.photos/seed/${seed}/960/540`;
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

function daysAgo(days: number, hour = 12): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, randomInt(0, 59), randomInt(0, 59), 0);
  return date;
}

async function ensureMockStudents(hasher: BcryptPasswordHasher): Promise<Types.ObjectId[]> {
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

async function addMember(
  groupId: Types.ObjectId,
  userId: Types.ObjectId,
  role: "owner" | "member",
  joinedAt: Date,
): Promise<void> {
  await GroupMemberModel.create({
    groupId,
    userId,
    role,
    joinedAt,
  });
}

async function seedMockGroups(): Promise<void> {
  if (groupTemplates.length !== 20) {
    throw new Error(`Expected 20 group templates, got ${groupTemplates.length}`);
  }

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

  const tester = await UserModel.findOne({
    email: TESTER_EMAIL.toLowerCase(),
    deletedAt: null,
  }).lean();

  if (!tester) {
    throw new Error(
      `Tester user ${TESTER_EMAIL} not found. Register/login with that account first, then re-run seed:mock-groups.`,
    );
  }

  await clearPreviousMockGroups();

  let groupsCreated = 0;
  let membersCreated = 0;
  let moodsCreated = 0;
  const createdGroupIds: Types.ObjectId[] = [];

  for (const [index, template] of groupTemplates.entries()) {
    const ownerId = studentIds[index % studentIds.length]!;
    const createdAt = daysAgo(randomInt(3, 30));

    const group = await GroupModel.create({
      name: template.name,
      description: template.description,
      coverImageUrl: coverUrl(template.coverSeed),
      ownerId,
      memberCount: 1,
      status: "active",
      createdAt,
      updatedAt: createdAt,
    });

    createdGroupIds.push(group._id);
    await addMember(group._id, ownerId, "owner", createdAt);
    membersCreated += 1;

    const extraMembers = pickMany(
      studentIds.filter((id) => !id.equals(ownerId)),
      randomInt(8, 22),
    );

    for (const userId of extraMembers) {
      await addMember(group._id, userId, "member", daysAgo(randomInt(0, 20)));
      membersCreated += 1;
    }

    await GroupModel.updateOne(
      { _id: group._id },
      { memberCount: 1 + extraMembers.length },
    );

    const memberPool = [ownerId, ...extraMembers];

    for (const moodTemplate of template.moodContents) {
      const tag = tagBySlug.get(moodTemplate.tagSlug);
      if (!tag) {
        throw new Error(`Unknown tag slug: ${moodTemplate.tagSlug}`);
      }

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

  const groupsForTester = createdGroupIds.slice(0, TESTER_JOIN_COUNT);
  let testerJoined = 0;

  for (const groupId of groupsForTester) {
    const existing = await GroupMemberModel.findOne({
      groupId,
      userId: tester._id,
    }).lean();

    if (existing) {
      continue;
    }

    await addMember(groupId, tester._id, "member", daysAgo(randomInt(0, 10)));
    await GroupModel.updateOne({ _id: groupId }, { $inc: { memberCount: 1 } });
    testerJoined += 1;
    membersCreated += 1;
  }

  logger.info("Mock groups seeded", {
    groups: groupsCreated,
    members: membersCreated,
    moods: moodsCreated,
    testerEmail: TESTER_EMAIL,
    testerJoined,
    testerTarget: TESTER_JOIN_COUNT,
  });

  await disconnectDatabase();
}

seedMockGroups().catch(async (error: unknown) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exitCode = 1;
});
