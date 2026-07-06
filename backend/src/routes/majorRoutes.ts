import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { validate } from "../middlewares/validate.js";
import { feedQuerySchema } from "../validators/moodSchemas.js";

export function createMajorRoutes(deps: Dependencies): Router {
  const router = Router();
  const { moodController, facultyController, optionalAuthenticate, rateLimiters } = deps;

  router.get("/:majorId", facultyController.getMajor);
  router.get(
    "/:majorId/moods",
    optionalAuthenticate,
    rateLimiters.feed,
    validate(feedQuerySchema, "query"),
    moodController.majorFeed,
  );

  return router;
}
