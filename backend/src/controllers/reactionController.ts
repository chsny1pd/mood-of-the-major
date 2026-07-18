import type { Response } from "express";
import type {
  ReactionService,
  ToggleReactionServiceInput,
} from "../application/services/ReactionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AuthenticationError } from "../domain/errors/AppError.js";

export function createReactionController(reactionService: ReactionService) {
  return {
    toggle: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const result = await reactionService.toggleReaction(
        req.userId,
        req.body as ToggleReactionServiceInput,
      );

      res.status(200).json({ success: true, data: result });
    }),

    remove: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const body = req.body as {
        targetType: "mood" | "comment";
        targetId: string;
        emoji: string;
      };
      const result = await reactionService.removeReaction(
        req.userId,
        body.targetType,
        body.targetId,
        body.emoji,
      );

      res.status(200).json({ success: true, data: result });
    }),

    get: asyncHandler(async (req, res: Response) => {
      const query = req.validatedQuery ?? req.query;
      const result = await reactionService.getReactions(
        query.targetType as "mood" | "comment",
        String(query.targetId),
        req.userId,
      );

      res.status(200).json({ success: true, data: result });
    }),
  };
}
