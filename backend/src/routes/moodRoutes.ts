import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { postRateLimiter } from "../middlewares/postRateLimiter.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { createMoodSchema, feedQuerySchema } from "../validators/moodSchemas.js";

export function createMoodRoutes(deps: Dependencies): Router {
  const router = Router();
  const { moodController, authenticate, optionalAuthenticate } = deps;

  router.get("/feed", optionalAuthenticate, validate(feedQuerySchema, "query"), moodController.feed);

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
