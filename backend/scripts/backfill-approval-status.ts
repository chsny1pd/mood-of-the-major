import "dotenv/config";
import { loadEnv } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
import { createLogger } from "../src/infrastructure/logging/logger.js";
import { FacultyModel } from "../src/infrastructure/database/models/Faculty.js";
import { MajorModel } from "../src/infrastructure/database/models/Major.js";
import { TagModel } from "../src/infrastructure/database/models/Tag.js";

async function backfillApprovalStatus(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);

  await connectDatabase(env.MONGODB_URI, logger);

  const [faculties, majors, tags] = await Promise.all([
    FacultyModel.updateMany(
      { approvalStatus: { $exists: false } },
      { $set: { approvalStatus: "approved" } },
    ),
    MajorModel.updateMany(
      { approvalStatus: { $exists: false } },
      { $set: { approvalStatus: "approved" } },
    ),
    TagModel.updateMany(
      { approvalStatus: { $exists: false } },
      { $set: { approvalStatus: "approved" } },
    ),
  ]);

  logger.info("Backfill completed", {
    facultiesUpdated: faculties.modifiedCount,
    majorsUpdated: majors.modifiedCount,
    tagsUpdated: tags.modifiedCount,
  });

  await disconnectDatabase();
}

backfillApprovalStatus().catch((error) => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
