import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { submitReportSchema } from "../validators/engagementSchemas.js";

export function createReportRoutes(deps: Dependencies): Router {
  const router = Router();
  const { reportController, authenticate } = deps;

  router.post(
    "/moods/:moodId/report",
    authenticate,
    authorize("student", "advisor", "administrator"),
    validate(submitReportSchema),
    reportController.reportMood,
  );

  router.post(
    "/comments/:commentId/report",
    authenticate,
    authorize("student", "advisor", "administrator"),
    validate(submitReportSchema),
    reportController.reportComment,
  );

  return router;
}
