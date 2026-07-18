import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import {
  reactionQuerySchema,
  removeReactionSchema,
  upsertReactionSchema,
} from "../validators/engagementSchemas.js";

export function createReactionRoutes(deps: Dependencies): Router {
  const router = Router();
  const { reactionController, authenticate, optionalAuthenticate } = deps;

  router.put(
    "/",
    authenticate,
    authorize("student", "administrator"),
    validate(upsertReactionSchema),
    reactionController.toggle,
  );

  router.delete(
    "/",
    authenticate,
    authorize("student", "administrator"),
    validate(removeReactionSchema),
    reactionController.remove,
  );

  router.get(
    "/",
    optionalAuthenticate,
    validate(reactionQuerySchema, "query"),
    reactionController.get,
  );

  return router;
}
