import { z } from "zod";
import { AUDIT_ACTIONS } from "../domain/constants/adminConstants.js";

const cursorQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  cursor: z.string().optional(),
});

export const adminReportListSchema = cursorQuery.extend({
  status: z
    .enum(["pending", "resolved_removed", "resolved_dismissed", "resolved_warned"])
    .optional(),
  targetType: z.enum(["mood", "comment"]).optional(),
});

export const resolveReportSchema = z.object({
  status: z.enum(["resolved_removed", "resolved_dismissed", "resolved_warned"]),
  resolutionNote: z.string().max(1000).optional(),
  removeContent: z.boolean().optional(),
});

export const adminUserListSchema = cursorQuery.extend({
  status: z.enum(["active", "suspended"]).optional(),
  role: z.enum(["student", "administrator", "advisor"]).optional(),
  q: z.string().max(200).optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "suspended"]),
  reason: z.string().max(500).optional(),
});

export const adminContentListSchema = cursorQuery.extend({
  status: z
    .enum(["active", "hidden", "moderated_removed", "deleted_by_author"])
    .optional(),
  minReportCount: z.coerce.number().int().min(0).optional(),
});

export const removeMoodSchema = z.object({
  reason: z.string().max(500).optional(),
  moderationNote: z.string().max(1000).optional(),
});

export const auditLogListSchema = cursorQuery.extend({
  adminId: z.string().optional(),
  action: z.enum(AUDIT_ACTIONS).optional(),
  targetType: z.string().optional(),
  identityAccessed: z.coerce.boolean().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  type: z.literal("emotion").optional(),
  colorToken: z.string().max(80).optional(),
  iconKey: z.string().max(80).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateTagSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  colorToken: z.string().max(80).optional(),
  iconKey: z.string().max(80).optional(),
});

export const notificationListSchema = cursorQuery.extend({
  isRead: z.coerce.boolean().optional(),
});
