import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { createServiceApiKeyGuard } from "../middlewares/serviceApiKeyGuard.js";

export function createJobRoutes(deps: Dependencies): Router {
  const router = Router();
  const { jobController, env } = deps;
  const guard = createServiceApiKeyGuard(env);

  router.post("/aggregate-statistics", guard, jobController.runAggregation);
  router.post("/cleanup-images", guard, jobController.runImageCleanup);

  return router;
}
