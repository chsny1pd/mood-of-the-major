import type { Response } from "express";
import { toAnonymousMoodDto } from "../application/mappers/moodMapper.js";
import type { BookmarkService } from "../application/services/BookmarkService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AuthenticationError } from "../domain/errors/AppError.js";

export function createBookmarkController(bookmarkService: BookmarkService) {
  return {
    create: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const bookmark = await bookmarkService.addBookmark(req.userId, (req.body as { moodId: string }).moodId);

      res.status(201).json({
        success: true,
        data: {
          id: bookmark.id,
          moodId: bookmark.moodId,
          createdAt: bookmark.createdAt.toISOString(),
        },
      });
    }),

    remove: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      await bookmarkService.removeBookmark(req.userId, String(req.params.moodId));

      res.status(200).json({
        success: true,
        data: { message: "Bookmark removed." },
      });
    }),

    list: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const query = req.validatedQuery ?? req.query;
      const result = await bookmarkService.listBookmarks(
        req.userId,
        query.limit ? Number(query.limit) : undefined,
        query.cursor ? String(query.cursor) : undefined,
      );

      res.status(200).json({
        success: true,
        data: result.items.map((item) => toAnonymousMoodDto(item)),
        meta: result.meta,
      });
    }),

    getStatus: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const bookmarked = await bookmarkService.isBookmarked(
        req.userId,
        String(req.params.moodId),
      );

      res.status(200).json({
        success: true,
        data: { moodId: String(req.params.moodId), bookmarked },
      });
    }),
  };
}
