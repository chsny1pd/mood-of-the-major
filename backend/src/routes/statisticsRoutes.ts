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

export function createJobRoutes(deps: Dependencies): Router {
  const router = Router();
  const { statisticsController, env } = deps;

  router.post("/aggregate-statistics", (req, res, next) => {
    const apiKey = req.header("x-service-api-key");
    if (!env.SERVICE_API_KEY || apiKey !== env.SERVICE_API_KEY) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid service API key." },
      });
      return;
    }

    void statisticsController.runAggregation(req, res, next);
  });

  return router;
}
