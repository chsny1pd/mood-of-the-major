import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { feedQuerySchema } from "../validators/moodSchemas.js";
import {
  submitFacultySchema,
  submitMajorSchema,
} from "../validators/submissionSchemas.js";

export function createFacultyRoutes(deps: Dependencies): Router {
  const router = Router();
  const { authenticate, rateLimiters } = deps;

  router.get("/", deps.facultyController.listFaculties);
  router.post(
    "/submissions",
    authenticate,
    authorize("student", "advisor", "administrator"),
    rateLimiters.post,
    validate(submitFacultySchema),
    deps.submissionController.submitFaculty,
  );
  router.get("/:facultyId/majors", deps.facultyController.listMajors);
  router.post(
    "/:facultyId/majors/submissions",
    authenticate,
    authorize("student", "advisor", "administrator"),
    rateLimiters.post,
    validate(submitMajorSchema),
    deps.submissionController.submitMajor,
  );
  router.get(
    "/:facultyId/moods",
    deps.optionalAuthenticate,
    deps.rateLimiters.feed,
    validate(feedQuerySchema, "query"),
    deps.moodController.facultyFeed,
  );

  return router;
}
