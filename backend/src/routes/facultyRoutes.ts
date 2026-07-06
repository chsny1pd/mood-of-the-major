import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { validate } from "../middlewares/validate.js";
import { feedQuerySchema } from "../validators/moodSchemas.js";

export function createFacultyRoutes(deps: Dependencies): Router {
  const router = Router();

  router.get("/", deps.facultyController.listFaculties);
  router.get("/:facultyId/majors", deps.facultyController.listMajors);
  router.get(
    "/:facultyId/moods",
    deps.optionalAuthenticate,
    validate(feedQuerySchema, "query"),
    deps.moodController.facultyFeed,
  );

  return router;
}
