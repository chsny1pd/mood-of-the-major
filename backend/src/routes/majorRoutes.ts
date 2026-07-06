import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { validate } from "../middlewares/validate.js";
import { feedQuerySchema } from "../validators/moodSchemas.js";

export function createMajorRoutes(deps: Dependencies): Router {
  const router = Router();
  const { moodController, optionalAuthenticate } = deps;

  router.get(
    "/:majorId/moods",
    optionalAuthenticate,
    validate(feedQuerySchema, "query"),
    moodController.majorFeed,
  );

  return router;
}
