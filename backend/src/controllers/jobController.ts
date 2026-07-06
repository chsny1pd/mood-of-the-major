import type { Response } from "express";
import type { ImageCleanupJob } from "../application/services/ImageCleanupJob.js";
import type { StatisticsAggregationJob } from "../application/services/StatisticsAggregationJob.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function createJobController(
  aggregationJob: StatisticsAggregationJob,
  imageCleanupJob: ImageCleanupJob,
) {
  return {
    runAggregation: asyncHandler(async (_req, res: Response) => {
      const result = await aggregationJob.run();
      res.status(200).json({ success: true, data: result });
    }),

    runImageCleanup: asyncHandler(async (_req, res: Response) => {
      const result = await imageCleanupJob.run();
      res.status(200).json({ success: true, data: result });
    }),
  };
}
