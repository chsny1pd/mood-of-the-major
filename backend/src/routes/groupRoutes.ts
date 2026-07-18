import { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import {
  createGroupMoodSchema,
  createGroupSchema,
  groupFeedQuerySchema,
  groupIdParamSchema,
  groupListQuerySchema,
  groupMemberParamSchema,
} from "../validators/groupSchemas.js";

export function createGroupRoutes(deps: Dependencies): Router {
  const router = Router();
  const { groupController, authenticate, rateLimiters } = deps;

  router.get(
    "/",
    authenticate,
    authorize("student", "administrator"),
    validate(groupListQuerySchema, "query"),
    groupController.list,
  );

  router.post(
    "/",
    authenticate,
    authorize("student", "administrator"),
    rateLimiters.post,
    validate(createGroupSchema),
    groupController.create,
  );

  router.get(
    "/mine",
    authenticate,
    authorize("student", "administrator"),
    groupController.listMine,
  );

  router.get(
    "/:groupId",
    authenticate,
    authorize("student", "administrator"),
    validate(groupIdParamSchema, "params"),
    groupController.getById,
  );

  router.post(
    "/:groupId/join",
    authenticate,
    authorize("student", "administrator"),
    rateLimiters.post,
    validate(groupIdParamSchema, "params"),
    groupController.join,
  );

  router.delete(
    "/:groupId/leave",
    authenticate,
    authorize("student", "administrator"),
    rateLimiters.post,
    validate(groupIdParamSchema, "params"),
    groupController.leave,
  );

  router.get(
    "/:groupId/members",
    authenticate,
    authorize("student", "administrator"),
    validate(groupIdParamSchema, "params"),
    groupController.listMembers,
  );

  router.delete(
    "/:groupId/members/:userId",
    authenticate,
    authorize("student", "administrator"),
    rateLimiters.post,
    validate(groupMemberParamSchema, "params"),
    groupController.kickMember,
  );

  router.get(
    "/:groupId/moods",
    authenticate,
    authorize("student", "administrator"),
    validate(groupIdParamSchema, "params"),
    validate(groupFeedQuerySchema, "query"),
    groupController.listMoods,
  );

  router.post(
    "/:groupId/moods",
    authenticate,
    authorize("student", "administrator"),
    rateLimiters.post,
    validate(groupIdParamSchema, "params"),
    validate(createGroupMoodSchema),
    groupController.createMood,
  );

  return router;
}
