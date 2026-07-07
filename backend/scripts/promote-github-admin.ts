import "dotenv/config";
import { randomBytes } from "node:crypto";
import { loadEnv } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/infrastructure/database/connection.js";
import { createLogger } from "../src/infrastructure/logging/logger.js";
import { BcryptPasswordHasher } from "../src/infrastructure/auth/BcryptPasswordHasher.js";
import { UserModel } from "../src/infrastructure/database/models/User.js";

const githubUsername = process.argv[2]?.trim().toLowerCase();

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface GitHubPublicUser {
  id: number;
  login: string;
  email: string | null;
}

async function fetchGitHubUser(login: string): Promise<GitHubPublicUser> {
  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "mood-of-the-major-seed" },
  });

  if (!response.ok) {
    throw new Error(`GitHub user "${login}" not found (${response.status})`);
  }

  return (await response.json()) as GitHubPublicUser;
}

function noreplyCandidates(login: string, githubId: number): string[] {
  return [
    `${githubId}+${login}@users.noreply.github.com`,
    `${login}@users.noreply.github.com`,
  ];
}

async function promoteGitHubAdmin(): Promise<void> {
  if (!githubUsername) {
    console.error("Usage: npm run promote:github-admin -- <github-username>");
    process.exit(1);
  }

  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);
  const hasher = new BcryptPasswordHasher(env.BCRYPT_ROUNDS);

  await connectDatabase(env.MONGODB_URI, logger);

  const githubUser = await fetchGitHubUser(githubUsername);
  const pattern = new RegExp(escapeRegex(githubUsername), "i");
  const candidateEmails = [
    ...(githubUser.email ? [githubUser.email.toLowerCase()] : []),
    ...noreplyCandidates(githubUser.login.toLowerCase(), githubUser.id),
  ];

  const user =
    (await UserModel.findOneAndUpdate(
      {
        deletedAt: null,
        $or: [{ email: pattern }, { email: { $in: candidateEmails } }],
      },
      { role: "administrator" },
      { returnDocument: "after" },
    )) ??
    (await UserModel.findOneAndUpdate(
      { email: candidateEmails[0]!, deletedAt: null },
      {
        email: candidateEmails[0],
        passwordHash: await hasher.hash(randomBytes(32).toString("hex")),
        role: "administrator",
        status: "active",
        facultyId: null,
        majorId: null,
        tokenVersion: 0,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ));

  if (!user) {
    throw new Error(`Unable to promote GitHub user "${githubUsername}".`);
  }

  logger.info("User promoted to administrator", {
    githubUsername: githubUser.login,
    email: user.email,
    id: user._id.toString(),
    note: "If GitHub OAuth uses a different primary email, rerun: npm run promote:admin -- <email>",
  });

  await disconnectDatabase();
}

promoteGitHubAdmin().catch((error) => {
  console.error("Promote GitHub admin failed:", error);
  process.exit(1);
});
