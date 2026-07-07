import { z } from "zod";

const nodeEnvSchema = z.enum(["development", "staging", "production", "test"]);

const baseSchema = z.object({
  NODE_ENV: nodeEnvSchema.default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default("15m"),
  CORS_ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().optional(),
  AGGREGATION_THRESHOLD_MIN: z.coerce.number().int().positive().default(5),
  SERVICE_API_KEY: z.string().optional(),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  ALLOWED_EMAIL_DOMAINS: z.string().optional(),
  FRONTEND_URL: z.string().url().optional(),
  OAUTH_CALLBACK_BASE_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_WRITE_WINDOW_MS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_WRITE_MAX: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_FEED_WINDOW_MS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_FEED_MAX: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_GENERAL_WINDOW_MS: z.coerce.number().int().positive().optional(),
  RATE_LIMIT_GENERAL_MAX: z.coerce.number().int().positive().optional(),
  ORPHAN_IMAGE_TTL_HOURS: z.coerce.number().int().positive().default(24),
  IMAGE_CLEANUP_BATCH_SIZE: z.coerce.number().int().positive().default(100),
  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof baseSchema>;

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  const parsed = baseSchema.safeParse(raw);

  if (!parsed.success) {
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  const env = parsed.data;

  if (env.NODE_ENV === "production") {
    const requiredInProduction = [
      "JWT_SECRET",
      "JWT_REFRESH_SECRET",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
    ] as const;

    for (const key of requiredInProduction) {
      if (!env[key] || env[key]!.length === 0) {
        console.error(`Missing required production environment variable: ${key}`);
        process.exit(1);
      }
    }
  }

  return env;
}

export function getCorsOrigins(env: Env): string[] {
  return env.CORS_ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
