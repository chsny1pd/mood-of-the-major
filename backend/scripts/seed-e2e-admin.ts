import "dotenv/config";
import { loadEnv } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
import { createLogger } from "../src/infrastructure/logging/logger.js";
import { BcryptPasswordHasher } from "../src/infrastructure/auth/BcryptPasswordHasher.js";
import { UserModel } from "../src/infrastructure/database/models/User.js";

const E2E_ADMIN_EMAIL = "e2e-admin@test.local";
const E2E_ADMIN_PASSWORD = "TestPass1";

async function seedE2eAdmin(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);

  await connectDatabase(env.MONGODB_URI, logger);

  const hasher = new BcryptPasswordHasher(env.BCRYPT_ROUNDS);
  const passwordHash = await hasher.hash(E2E_ADMIN_PASSWORD);

  await UserModel.findOneAndUpdate(
    { email: E2E_ADMIN_EMAIL },
    {
      email: E2E_ADMIN_EMAIL,
      passwordHash,
      role: "administrator",
      status: "active",
      facultyId: null,
      majorId: null,
      deletedAt: null,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  logger.info("E2E admin user ready", { email: E2E_ADMIN_EMAIL });

  await disconnectDatabase();
}

seedE2eAdmin().catch((error) => {
  console.error("seed-e2e-admin failed:", error);
  process.exit(1);
});
