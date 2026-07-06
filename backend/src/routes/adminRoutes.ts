import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { authorize } from "../middlewares/authorize.js";
import { adminController } from "../controllers/adminController.js";

export function createAdminRoutes(deps: Dependencies): Router {
  const router = Router();

  router.get("/overview", deps.authenticate, authorize("administrator"), adminController.overview);

  return router;
}
