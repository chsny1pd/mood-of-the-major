import type { Request, Response } from "express";
import type { CreateMoodServiceInput, MoodService } from "../application/services/MoodService.js";
import { toAnonymousMoodDto } from "../application/mappers/moodMapper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AuthenticationError } from "../domain/errors/AppError.js";

function parseFeedQuery(req: Request) {
  const query = req.validatedQuery ?? req.query;

  return {
    limit: query.limit ? Number(query.limit) : undefined,
    cursor: query.cursor ? String(query.cursor) : undefined,
    sort: query.sort as "newest" | "most_reacted" | "most_commented" | undefined,
    tagSlug: query.tagSlug ? String(query.tagSlug) : undefined,
    from: query.from ? String(query.from) : undefined,
    to: query.to ? String(query.to) : undefined,
    majorId: query.majorId ? String(query.majorId) : undefined,
    isAuthenticated: Boolean(req.userId),
  };
}

export function createMoodController(moodService: MoodService) {
  return {
    create: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const mood = await moodService.createMood(req.userId, req.body as CreateMoodServiceInput);

      res.status(201).json({
        success: true,
        data: toAnonymousMoodDto(mood),
      });
    }),

    getById: asyncHandler(async (req, res: Response) => {
      const mood = await moodService.getMood(String(req.params.moodId));

      res.status(200).json({
        success: true,
        data: toAnonymousMoodDto(mood),
      });
    }),

    delete: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const result = await moodService.deleteMood(
        req.userId,
        String(req.params.moodId),
        req.userRole === "administrator",
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    }),

    feed: asyncHandler(async (req, res: Response) => {
      const result = await moodService.getFeed(parseFeedQuery(req));

      res.status(200).json({
        success: true,
        data: result.items.map(toAnonymousMoodDto),
        meta: result.meta,
      });
    }),

    facultyFeed: asyncHandler(async (req, res: Response) => {
      const result = await moodService.getFacultyFeed(String(req.params.facultyId), parseFeedQuery(req));

      res.status(200).json({
        success: true,
        data: result.items.map(toAnonymousMoodDto),
        meta: result.meta,
      });
    }),

    majorFeed: asyncHandler(async (req, res: Response) => {
      const result = await moodService.getMajorFeed(String(req.params.majorId), parseFeedQuery(req));

      res.status(200).json({
        success: true,
        data: result.items.map(toAnonymousMoodDto),
        meta: result.meta,
      });
    }),
  };
}
