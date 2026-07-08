import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { submitTagSchema } from "../validators/submissionSchemas.js";

export function createTagRoutes(deps: Dependencies): Router {
  const router = Router();
  const { authenticate, rateLimiters } = deps;

  router.get("/", deps.tagController.listEmotions);
  router.post(
    "/submissions",
    authenticate,
    authorize("student", "advisor", "administrator"),
    rateLimiters.post,
    validate(submitTagSchema),
    deps.submissionController.submitTag,
  );
  return router;
}
