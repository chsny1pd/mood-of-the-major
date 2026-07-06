import "dotenv/config";
import { loadEnv } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
import { createLogger } from "../src/infrastructure/logging/logger.js";
import { UserModel } from "../src/infrastructure/database/models/User.js";

const email = process.argv[2];

async function promoteAdmin(): Promise<void> {
  if (!email) {
    console.error("Usage: npm run promote:admin -- <email>");
    process.exit(1);
  }

  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);

  await connectDatabase(env.MONGODB_URI, logger);

  const user = await UserModel.findOneAndUpdate(
    { email: email.toLowerCase(), deletedAt: null },
    { role: "administrator" },
    { returnDocument: "after" },
  );

  if (!user) {
    throw new Error(`User not found: ${email}`);
  }

  logger.info("User promoted to administrator", { email: user.email, id: user._id.toString() });

  await disconnectDatabase();
}

promoteAdmin().catch((error) => {
  console.error("Promote admin failed:", error);
  process.exit(1);
});
