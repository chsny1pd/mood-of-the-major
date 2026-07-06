import mongoose from "mongoose";
import type { Logger } from "../logging/logger.js";

export type DatabaseStatus = "disconnected" | "connecting" | "connected" | "disconnecting";

export async function connectDatabase(uri: string, logger: Logger): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  logger.info("Connecting to MongoDB...");
  await mongoose.connect(uri);
  logger.info("MongoDB connected");
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
}

export function getDatabaseStatus(): DatabaseStatus {
  const states: DatabaseStatus[] = [
    "disconnected",
    "connected",
    "connecting",
    "disconnecting",
  ];

  return states[mongoose.connection.readyState] ?? "disconnected";
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}
