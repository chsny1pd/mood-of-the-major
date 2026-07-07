import "dotenv/config";
import { loadEnv } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
import { createLogger } from "../src/infrastructure/logging/logger.js";
import { FacultyModel } from "../src/infrastructure/database/models/Faculty.js";
import { MajorModel } from "../src/infrastructure/database/models/Major.js";
import { TagModel } from "../src/infrastructure/database/models/Tag.js";
import {
  KMITL_FACULTIES,
  LEGACY_FACULTY_SLUGS,
  LEGACY_MAJOR_SLUGS,
} from "./data/kmitl-reference-data.js";

const emotionTags = [
  {
    name: "Stress",
    nameTh: "ความเครียด",
    slug: "stress",
    colorToken: "emotion-stress",
    iconKey: "stress",
    sortOrder: 1,
  },
  {
    name: "Joy",
    nameTh: "ความสุข",
    slug: "joy",
    colorToken: "emotion-joy",
    iconKey: "joy",
    sortOrder: 2,
  },
  {
    name: "Anxiety",
    nameTh: "ความวิตกกังวล",
    slug: "anxiety",
    colorToken: "emotion-anxiety",
    iconKey: "anxiety",
    sortOrder: 3,
  },
  {
    name: "Gratitude",
    nameTh: "ความกตัญญู",
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

  await FacultyModel.updateMany(
    { slug: { $in: LEGACY_FACULTY_SLUGS } },
    { isActive: false },
  );
  await MajorModel.updateMany({ slug: { $in: LEGACY_MAJOR_SLUGS } }, { isActive: false });

  let majorCount = 0;

  for (const faculty of KMITL_FACULTIES) {
    const facultyDoc = await FacultyModel.findOneAndUpdate(
      { slug: faculty.slug },
      {
        name: faculty.nameEn,
        nameTh: faculty.nameTh,
        slug: faculty.slug,
        code: faculty.code,
        description: faculty.description ?? null,
        isActive: true,
        sortOrder: faculty.sortOrder,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    for (const [index, major] of faculty.majors.entries()) {
      await MajorModel.findOneAndUpdate(
        { facultyId: facultyDoc._id, slug: major.slug },
        {
          facultyId: facultyDoc._id,
          name: major.nameEn,
          nameTh: major.nameTh,
          slug: major.slug,
          code: major.code ?? null,
          isActive: true,
          sortOrder: index + 1,
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      majorCount += 1;
    }
  }

  for (const tag of emotionTags) {
    await TagModel.findOneAndUpdate(
      { type: "emotion", slug: tag.slug },
      {
        name: tag.name,
        nameTh: tag.nameTh,
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
    faculties: KMITL_FACULTIES.length,
    majors: majorCount,
    tags: emotionTags.length,
  });

  await disconnectDatabase();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
