import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import {
  adminContentListSchema,
  adminReportListSchema,
  adminUserListSchema,
  auditLogListSchema,
  createTagSchema,
  removeMoodSchema,
  resolveReportSchema,
  updateTagSchema,
  updateUserStatusSchema,
} from "../validators/adminSchemas.js";

export function createAdminRoutes(deps: Dependencies): Router {
  const router = Router();
  const { adminController, authenticate } = deps;
  const adminOnly = [authenticate, authorize("administrator")] as const;

  router.get("/dashboard", ...adminOnly, adminController.dashboard);
  router.get("/overview", ...adminOnly, adminController.dashboard);

  router.get(
    "/reports",
    ...adminOnly,
    validate(adminReportListSchema, "query"),
    adminController.listReports,
  );
  router.get("/reports/:reportId", ...adminOnly, adminController.getReport);
  router.post(
    "/reports/:reportId/resolve",
    ...adminOnly,
    validate(resolveReportSchema),
    adminController.resolveReport,
  );

  router.get(
    "/content/moods",
    ...adminOnly,
    validate(adminContentListSchema, "query"),
    adminController.listContentMoods,
  );
  router.get("/moods/:moodId", ...adminOnly, adminController.getMood);
  router.post(
    "/moods/:moodId/remove",
    ...adminOnly,
    validate(removeMoodSchema),
    adminController.removeMood,
  );

  router.get(
    "/users",
    ...adminOnly,
    validate(adminUserListSchema, "query"),
    adminController.listUsers,
  );
  router.get("/users/:userId", ...adminOnly, adminController.getUser);
  router.patch(
    "/users/:userId/status",
    ...adminOnly,
    validate(updateUserStatusSchema),
    adminController.updateUserStatus,
  );

  router.get(
    "/audit-logs",
    ...adminOnly,
    validate(auditLogListSchema, "query"),
    adminController.listAuditLogs,
  );

  router.get("/tags", ...adminOnly, adminController.listTags);
  router.post("/tags", ...adminOnly, validate(createTagSchema), adminController.createTag);
  router.patch(
    "/tags/:tagId",
    ...adminOnly,
    validate(updateTagSchema),
    adminController.updateTag,
  );

  return router;
}
