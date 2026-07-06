import "dotenv/config";
import { createApp } from "./app.js";
import { createDependencies } from "./config/di.js";
import { loadEnv } from "./config/env.js";
import { initSentry } from "./infrastructure/monitoring/sentry.js";

async function main(): Promise<void> {
  const env = loadEnv();
  initSentry(env);
  const deps = createDependencies(env);
  const app = createApp(deps);

  await deps.database.connect();

  const server = app.listen(env.PORT, () => {
    deps.logger.info(`Server listening on port ${env.PORT}`, { env: env.NODE_ENV });
  });

  const shutdown = async (signal: string) => {
    deps.logger.info(`Received ${signal}, shutting down...`);
    server.close(async () => {
      await deps.database.disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
