import type { Response } from "express";
import { toAnonymousCommentDto } from "../application/mappers/commentMapper.js";
import type { CommentService, CreateCommentInput } from "../application/services/CommentService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AuthenticationError } from "../domain/errors/AppError.js";

export function createCommentController(commentService: CommentService) {
  return {
    listByMood: asyncHandler(async (req, res: Response) => {
      const query = req.validatedQuery ?? req.query;
      const result = await commentService.listComments({
        moodId: String(req.params.moodId),
        limit: query.limit ? Number(query.limit) : undefined,
        cursor: query.cursor ? String(query.cursor) : undefined,
        sort: query.sort as "oldest" | "newest" | undefined,
        viewerUserId: req.userId,
      });

      res.status(200).json({
        success: true,
        data: result.items.map((comment) =>
          toAnonymousCommentDto(comment, {
            isOwner: result.ownedCommentIds.has(comment.id) ? true : undefined,
          }),
        ),
        meta: result.meta,
      });
    }),

    create: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const comment = await commentService.createComment(
        req.userId,
        String(req.params.moodId),
        req.body as CreateCommentInput,
      );

      res.status(201).json({
        success: true,
        data: toAnonymousCommentDto(comment),
      });
    }),

    getById: asyncHandler(async (req, res: Response) => {
      const comment = await commentService.getComment(String(req.params.commentId));

      res.status(200).json({
        success: true,
        data: toAnonymousCommentDto(comment),
      });
    }),

    delete: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      await commentService.deleteComment(
        req.userId,
        String(req.params.commentId),
        req.userRole === "administrator",
      );

      res.status(200).json({
        success: true,
        data: { message: "Comment deleted successfully." },
      });
    }),
  };
}
