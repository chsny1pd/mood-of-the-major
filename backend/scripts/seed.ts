import "dotenv/config";
import { loadEnv } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
import { createLogger } from "../src/infrastructure/logging/logger.js";
import { FacultyModel } from "../src/infrastructure/database/models/Faculty.js";
import { MajorModel } from "../src/infrastructure/database/models/Major.js";
import { TagModel } from "../src/infrastructure/database/models/Tag.js";

const faculties = [
  {
    name: "Faculty of Engineering",
    slug: "engineering",
    code: "ENG",
    description: "Engineering programs and community.",
    sortOrder: 1,
    majors: [
      { name: "Computer Science", slug: "computer-science", code: "CS", sortOrder: 1 },
      { name: "Electrical Engineering", slug: "electrical-engineering", code: "EE", sortOrder: 2 },
    ],
  },
  {
    name: "Faculty of Science",
    slug: "science",
    code: "SCI",
    description: "Science programs and community.",
    sortOrder: 2,
    majors: [
      { name: "Mathematics", slug: "mathematics", code: "MATH", sortOrder: 1 },
      { name: "Physics", slug: "physics", code: "PHY", sortOrder: 2 },
    ],
  },
];

const emotionTags = [
  { name: "Stress", slug: "stress", colorToken: "emotion-stress", iconKey: "stress", sortOrder: 1 },
  { name: "Joy", slug: "joy", colorToken: "emotion-joy", iconKey: "joy", sortOrder: 2 },
  {
    name: "Anxiety",
    slug: "anxiety",
    colorToken: "emotion-anxiety",
    iconKey: "anxiety",
    sortOrder: 3,
  },
  {
    name: "Gratitude",
    slug: "gratitude",
    colorToken: "emotion-gratitude",
    iconKey: "gratitude",
    sortOrder: 4,
  },
];

async function seed(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);

  await connectDatabase(env.MONGODB_URI, logger);

  for (const faculty of faculties) {
    const facultyDoc = await FacultyModel.findOneAndUpdate(
      { slug: faculty.slug },
      {
        name: faculty.name,
        slug: faculty.slug,
        code: faculty.code,
        description: faculty.description,
        isActive: true,
        sortOrder: faculty.sortOrder,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    for (const major of faculty.majors) {
      await MajorModel.findOneAndUpdate(
        { facultyId: facultyDoc._id, slug: major.slug },
        {
          facultyId: facultyDoc._id,
          name: major.name,
          slug: major.slug,
          code: major.code,
          isActive: true,
          sortOrder: major.sortOrder,
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
    }
  }

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

  logger.info("Seed completed", {
    faculties: faculties.length,
    majors: faculties.reduce((sum, f) => sum + f.majors.length, 0),
    tags: emotionTags.length,
  });

  await disconnectDatabase();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
