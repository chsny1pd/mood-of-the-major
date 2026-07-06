import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { validate } from "../middlewares/validate.js";
import { notificationListSchema } from "../validators/adminSchemas.js";

export function createNotificationRoutes(deps: Dependencies): Router {
  const router = Router();
  const { notificationController, authenticate } = deps;

  router.get(
    "/",
    authenticate,
    validate(notificationListSchema, "query"),
    notificationController.list,
  );
  router.patch("/:notificationId/read", authenticate, notificationController.markRead);
  router.post("/read-all", authenticate, notificationController.markAllRead);
  router.delete("/:notificationId", authenticate, notificationController.delete);

  return router;
}
