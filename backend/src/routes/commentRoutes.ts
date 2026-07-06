import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { commentRateLimiter } from "../middlewares/commentRateLimiter.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import {
  commentListQuerySchema,
  createCommentSchema,
} from "../validators/engagementSchemas.js";

export function createCommentRoutes(deps: Dependencies): Router {
  const router = Router();
  const { commentController, authenticate, optionalAuthenticate } = deps;

  router.get(
    "/moods/:moodId/comments",
    optionalAuthenticate,
    validate(commentListQuerySchema, "query"),
    commentController.listByMood,
  );

  router.post(
    "/moods/:moodId/comments",
    authenticate,
    authorize("student"),
    commentRateLimiter,
    validate(createCommentSchema),
    commentController.create,
  );

  router.get(
    "/comments/:commentId",
    optionalAuthenticate,
    commentController.getById,
  );

  router.delete(
    "/comments/:commentId",
    authenticate,
    authorize("student", "administrator"),
    commentController.delete,
  );

  return router;
}
