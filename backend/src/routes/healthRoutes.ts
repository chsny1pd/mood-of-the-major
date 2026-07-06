import { Router } from "express";
import { healthController } from "../controllers/healthController.js";

export function createHealthRoutes(): Router {
  const router = Router();

  router.get("/health", healthController.getHealth);
  router.get("/ready", healthController.getReady);

  return router;
}
