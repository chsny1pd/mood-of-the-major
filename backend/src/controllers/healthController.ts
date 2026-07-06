import type { Response } from "express";
import { isDatabaseReady } from "../infrastructure/database/connection.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const healthController = {
  getHealth: asyncHandler(async (_req, res: Response) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }),

  getReady: asyncHandler(async (_req, res: Response) => {
    if (!isDatabaseReady()) {
      res.status(503).json({
        status: "not_ready",
        checks: {
          database: "disconnected",
        },
      });
      return;
    }

    res.status(200).json({
      status: "ready",
      checks: {
        database: "connected",
      },
    });
  }),
};
