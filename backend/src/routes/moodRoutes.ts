import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { postRateLimiter } from "../middlewares/postRateLimiter.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { createMoodSchema, feedQuerySchema } from "../validators/moodSchemas.js";
import { searchQuerySchema } from "../validators/engagementSchemas.js";
import { trendingQuerySchema } from "../validators/statisticsSchemas.js";

export function createMoodRoutes(deps: Dependencies): Router {
  const router = Router();
  const { moodController, statisticsController, authenticate, optionalAuthenticate } = deps;

  router.get("/feed", optionalAuthenticate, validate(feedQuerySchema, "query"), moodController.feed);

  router.get(
    "/search",
    authenticate,
    authorize("student", "advisor", "administrator"),
    validate(searchQuerySchema, "query"),
    moodController.search,
  );

  router.get("/trending", validate(trendingQuerySchema, "query"), statisticsController.trending);

  router.post(
    "/",
    authenticate,
    authorize("student"),
    postRateLimiter,
    validate(createMoodSchema),
    moodController.create,
  );

  router.get("/:moodId", optionalAuthenticate, moodController.getById);
  router.delete("/:moodId", authenticate, authorize("student", "administrator"), moodController.delete);

  return router;
}
