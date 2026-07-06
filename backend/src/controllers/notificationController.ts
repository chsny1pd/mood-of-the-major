import type { Response } from "express";
import type { NotificationService } from "../application/services/NotificationService.js";
import { AuthenticationError } from "../domain/errors/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function createNotificationController(notificationService: NotificationService) {
  return {
    list: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const query = req.validatedQuery ?? req.query;
      const data = await notificationService.listForUser(req.userId, {
        isRead: query.isRead === "true" ? true : query.isRead === "false" ? false : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
        cursor: query.cursor ? String(query.cursor) : undefined,
      });

      res.status(200).json({ success: true, data: data.items, meta: data.meta });
    }),

    markRead: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const data = await notificationService.markRead(req.userId, String(req.params.notificationId));
      res.status(200).json({ success: true, data });
    }),

    markAllRead: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const data = await notificationService.markAllRead(req.userId);
      res.status(200).json({ success: true, data });
    }),

    delete: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      await notificationService.delete(req.userId, String(req.params.notificationId));
      res.status(200).json({ success: true, data: { deleted: true } });
    }),
  };
}
