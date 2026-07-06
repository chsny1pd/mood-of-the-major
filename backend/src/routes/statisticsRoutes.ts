import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { statisticsScopeQuerySchema } from "../validators/statisticsSchemas.js";

export function createStatisticsRoutes(deps: Dependencies): Router {
  const router = Router();
  const { statisticsController, authenticate } = deps;

  router.get(
    "/dashboard",
    authenticate,
    authorize("student", "advisor", "administrator"),
    validate(statisticsScopeQuerySchema, "query"),
    statisticsController.dashboard,
  );

  router.get(
    "/emotions",
    authenticate,
    authorize("student", "advisor", "administrator"),
    validate(statisticsScopeQuerySchema, "query"),
    statisticsController.dashboard,
  );

  return router;
}
