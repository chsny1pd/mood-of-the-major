import type { Response } from "express";
import type { StatisticsAggregationJob } from "../application/services/StatisticsAggregationJob.js";
import type { StatisticsService } from "../application/services/StatisticsService.js";
import type { TrendingService } from "../application/services/TrendingService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function createStatisticsController(
  statisticsService: StatisticsService,
  trendingService: TrendingService,
  aggregationJob: StatisticsAggregationJob,
) {
  return {
    dashboard: asyncHandler(async (req, res: Response) => {
      const query = req.validatedQuery ?? req.query;
      const data = await statisticsService.getDashboard({
        scope: String(query.scope ?? "platform"),
        scopeId: query.scopeId ? String(query.scopeId) : undefined,
        period: query.period ? String(query.period) : undefined,
      });

      res.status(200).json({ success: true, data });
    }),

    trending: asyncHandler(async (req, res: Response) => {
      const query = req.validatedQuery ?? req.query;
      const data = await trendingService.getTrending({
        scope: query.scope ? String(query.scope) : undefined,
        scopeId: query.scopeId ? String(query.scopeId) : undefined,
        window: query.window ? String(query.window) : undefined,
      });

      res.status(200).json({ success: true, data });
    }),

    runAggregation: asyncHandler(async (_req, res: Response) => {
      const result = await aggregationJob.run();
      res.status(200).json({ success: true, data: result });
    }),
  };
}
