import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import {
  bookmarkListQuerySchema,
  createBookmarkSchema,
} from "../validators/engagementSchemas.js";

export function createBookmarkRoutes(deps: Dependencies): Router {
  const router = Router();
  const { bookmarkController, authenticate } = deps;

  router.get(
    "/",
    authenticate,
    authorize("student", "administrator"),
    validate(bookmarkListQuerySchema, "query"),
    bookmarkController.list,
  );

  router.post(
    "/",
    authenticate,
    authorize("student", "administrator"),
    validate(createBookmarkSchema),
    bookmarkController.create,
  );

  router.get(
    "/status/:moodId",
    authenticate,
    authorize("student", "administrator"),
    bookmarkController.getStatus,
  );

  router.delete(
    "/:moodId",
    authenticate,
    authorize("student", "administrator"),
    bookmarkController.remove,
  );

  return router;
}
