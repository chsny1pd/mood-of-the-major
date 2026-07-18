import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { createMoodSchema, feedQuerySchema, updateMoodSchema } from "../validators/moodSchemas.js";
import { searchQuerySchema } from "../validators/engagementSchemas.js";
import { trendingQuerySchema } from "../validators/statisticsSchemas.js";

export function createMoodRoutes(deps: Dependencies): Router {
  const router = Router();
  const { moodController, statisticsController, authenticate, optionalAuthenticate, rateLimiters } =
    deps;

  router.get(
    "/feed",
    optionalAuthenticate,
    rateLimiters.feed,
    validate(feedQuerySchema, "query"),
    moodController.feed,
  );

  router.get(
    "/search",
    optionalAuthenticate,
    rateLimiters.feed,
    validate(searchQuerySchema, "query"),
    moodController.search,
  );

  router.get("/trending", validate(trendingQuerySchema, "query"), statisticsController.trending);

  router.post(
    "/",
    authenticate,
    authorize("student", "administrator"),
    rateLimiters.post,
    validate(createMoodSchema),
    moodController.create,
  );

  router.post(
    "/:moodId/repost",
    authenticate,
    authorize("student", "administrator"),
    rateLimiters.post,
    moodController.repost,
  );

  router.get("/:moodId", optionalAuthenticate, moodController.getById);

  router.patch(
    "/:moodId",
    authenticate,
    authorize("student", "administrator"),
    rateLimiters.post,
    validate(updateMoodSchema),
    moodController.update,
  );

  router.delete("/:moodId", authenticate, authorize("student", "administrator"), moodController.delete);

  return router;
}
