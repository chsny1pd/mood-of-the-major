import type { Response } from "express";
import { toAnonymousMoodDto } from "../application/mappers/moodMapper.js";
import type { GroupService } from "../application/services/GroupService.js";
import { AuthenticationError } from "../domain/errors/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function createGroupController(groupService: GroupService) {
  return {
    list: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const query = req.validatedQuery ?? req.query;
      const result = await groupService.listGroups(req.userId, {
        q: query.q ? String(query.q) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
        cursor: query.cursor ? String(query.cursor) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.items,
        meta: result.meta,
      });
    }),

    create: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const body = req.body as {
        name: string;
        description?: string;
        coverImageUrl?: string | null;
      };

      const group = await groupService.createGroup(req.userId, body);

      res.status(201).json({
        success: true,
        data: group,
      });
    }),

    getById: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const group = await groupService.getGroup(req.userId, String(req.params.groupId));

      res.status(200).json({
        success: true,
        data: group,
      });
    }),

    join: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const group = await groupService.joinGroup(req.userId, String(req.params.groupId));

      res.status(200).json({
        success: true,
        data: group,
      });
    }),

    leave: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      await groupService.leaveGroup(req.userId, String(req.params.groupId));

      res.status(200).json({
        success: true,
        data: { message: "Left the group." },
      });
    }),

    listMembers: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const members = await groupService.listMembers(req.userId, String(req.params.groupId));

      res.status(200).json({
        success: true,
        data: members,
      });
    }),

    kickMember: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      await groupService.kickMember(
        req.userId,
        String(req.params.groupId),
        String(req.params.userId),
      );

      res.status(200).json({
        success: true,
        data: { message: "Member removed." },
      });
    }),

    listMoods: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const query = req.validatedQuery ?? req.query;
      const result = await groupService.getGroupFeed(req.userId, String(req.params.groupId), {
        limit: query.limit ? Number(query.limit) : undefined,
        cursor: query.cursor ? String(query.cursor) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.items.map((item) => toAnonymousMoodDto(item)),
        meta: result.meta,
      });
    }),

    createMood: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const mood = await groupService.createGroupMood(
        req.userId,
        String(req.params.groupId),
        req.body as {
          content: string;
          facultyId?: string;
          majorId?: string;
          tagIds: string[];
          primaryTagId: string;
          imageIds?: string[];
        },
      );

      res.status(201).json({
        success: true,
        data: toAnonymousMoodDto(mood),
      });
    }),
  };
}
