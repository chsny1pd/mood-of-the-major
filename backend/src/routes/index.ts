import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { createAdminRoutes } from "./adminRoutes.js";
import { createAuthRoutes } from "./authRoutes.js";
import { createBookmarkRoutes } from "./bookmarkRoutes.js";
import { createCommentRoutes } from "./commentRoutes.js";
import { createFacultyRoutes } from "./facultyRoutes.js";
import { createImageRoutes } from "./imageRoutes.js";
import { createMajorRoutes } from "./majorRoutes.js";
import { createMoodRoutes } from "./moodRoutes.js";
import { createReactionRoutes } from "./reactionRoutes.js";
import { createReportRoutes } from "./reportRoutes.js";
import { createStatisticsRoutes, createJobRoutes } from "./statisticsRoutes.js";
import { createTagRoutes } from "./tagRoutes.js";

export function createApiRoutes(deps: Dependencies): Router {
  const router = Router();

  router.use("/auth", createAuthRoutes(deps));
  router.use("/faculties", createFacultyRoutes(deps));
  router.use("/majors", createMajorRoutes(deps));
  router.use("/moods", createMoodRoutes(deps));
  router.use("/images", createImageRoutes(deps));
  router.use("/tags", createTagRoutes(deps));
  router.use("/reactions", createReactionRoutes(deps));
  router.use("/bookmarks", createBookmarkRoutes(deps));
  router.use(createCommentRoutes(deps));
  router.use(createReportRoutes(deps));
  router.use("/statistics", createStatisticsRoutes(deps));
  router.use("/internal/jobs", createJobRoutes(deps));
  router.use("/admin", createAdminRoutes(deps));

  return router;
}

