import { Router } from "express";
import type { Dependencies } from "../config/di.js";

export function createTagRoutes(deps: Dependencies): Router {
  const router = Router();
  router.get("/", deps.tagController.listEmotions);
  return router;
}
