import { Router } from "express";

export function createApiRoutes(): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({
      success: true,
      data: {
        name: "Mood of the Major API",
        version: "v1",
        message: "API routes will be mounted here in Sprint 2+",
      },
    });
  });

  return router;
}
