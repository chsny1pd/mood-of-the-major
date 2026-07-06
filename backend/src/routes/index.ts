import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { createAdminRoutes } from "./adminRoutes.js";
import { createAuthRoutes } from "./authRoutes.js";
import { createFacultyRoutes } from "./facultyRoutes.js";
import { createImageRoutes } from "./imageRoutes.js";
import { createMajorRoutes } from "./majorRoutes.js";
import { createMoodRoutes } from "./moodRoutes.js";
import { createTagRoutes } from "./tagRoutes.js";

export function createApiRoutes(deps: Dependencies): Router {
  const router = Router();

  router.use("/auth", createAuthRoutes(deps));
  router.use("/faculties", createFacultyRoutes(deps));
  router.use("/majors", createMajorRoutes(deps));
  router.use("/moods", createMoodRoutes(deps));
  router.use("/images", createImageRoutes(deps));
  router.use("/tags", createTagRoutes(deps));
  router.use("/admin", createAdminRoutes(deps));

  return router;
}
