import type { Env } from "./env.js";
import { createLogger } from "../infrastructure/logging/logger.js";
import {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
} from "../infrastructure/database/connection.js";

export interface AppDependencies {
  env: Env;
  logger: ReturnType<typeof createLogger>;
  database: {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    getStatus: () => ReturnType<typeof getDatabaseStatus>;
  };
}

export function createDependencies(env: Env): AppDependencies {
  const logger = createLogger(env.LOG_LEVEL);

  return {
    env,
    logger,
    database: {
      connect: () => connectDatabase(env.MONGODB_URI, logger),
      disconnect: disconnectDatabase,
      getStatus: getDatabaseStatus,
    },
  };
}

export type Dependencies = AppDependencies;
