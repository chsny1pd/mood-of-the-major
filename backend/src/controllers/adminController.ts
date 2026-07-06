import type { Request, Response } from "express";
import type { AdminService } from "../application/services/AdminService.js";
import type { UserStatus } from "../domain/entities/User.js";
import { AuthenticationError } from "../domain/errors/AppError.js";
import type { ResolveReportInput } from "../domain/ports/IReportRepository.js";
import type { CreateTagInput, UpdateTagInput } from "../domain/ports/ITagRepository.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function requireAdminId(req: Request): string {
  if (!req.userId) {
    throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
  }
  return req.userId;
}

function clientIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? null;
  return req.ip ?? null;
}

export function createAdminController(adminService: AdminService) {
  return {
    dashboard: asyncHandler(async (_req, res: Response) => {
      const data = await adminService.getDashboard();
      res.status(200).json({ success: true, data });
    }),

    listReports: asyncHandler(async (req, res: Response) => {
      const query = req.validatedQuery ?? req.query;
      const data = await adminService.listReports({
        status: query.status as never,
        targetType: query.targetType as never,
        limit: query.limit ? Number(query.limit) : undefined,
        cursor: query.cursor ? String(query.cursor) : undefined,
      });
      res.status(200).json({ success: true, data: data.items, meta: data.meta });
    }),

    getReport: asyncHandler(async (req, res: Response) => {
      const data = await adminService.getReportDetail(
        requireAdminId(req),
        String(req.params.reportId),
        clientIp(req),
      );
      res.status(200).json({ success: true, data });
    }),

    resolveReport: asyncHandler(async (req, res: Response) => {
      const data = await adminService.resolveReport(
        requireAdminId(req),
        String(req.params.reportId),
        req.body as ResolveReportInput,
        clientIp(req),
      );
      res.status(200).json({ success: true, data });
    }),

    getMood: asyncHandler(async (req, res: Response) => {
      const data = await adminService.getMoodAdmin(
        requireAdminId(req),
        String(req.params.moodId),
        clientIp(req),
      );
      res.status(200).json({ success: true, data });
    }),

    removeMood: asyncHandler(async (req, res: Response) => {
      const data = await adminService.removeMood(
        requireAdminId(req),
        String(req.params.moodId),
        req.body as { reason?: string; moderationNote?: string },
        clientIp(req),
      );
      res.status(200).json({ success: true, data });
    }),

    listContentMoods: asyncHandler(async (req, res: Response) => {
      const query = req.validatedQuery ?? req.query;
      const data = await adminService.listContentMoods({
        status: query.status ? String(query.status) : undefined,
        minReportCount: query.minReportCount ? Number(query.minReportCount) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
        cursor: query.cursor ? String(query.cursor) : undefined,
      });
      res.status(200).json({ success: true, data: data.items, meta: data.meta });
    }),

    listUsers: asyncHandler(async (req, res: Response) => {
      const query = req.validatedQuery ?? req.query;
      const data = await adminService.listUsers({
        status: query.status as never,
        role: query.role ? String(query.role) : undefined,
        q: query.q ? String(query.q) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
        cursor: query.cursor ? String(query.cursor) : undefined,
      });
      res.status(200).json({ success: true, data: data.items, meta: data.meta });
    }),

    getUser: asyncHandler(async (req, res: Response) => {
      const data = await adminService.getUserDetail(
        requireAdminId(req),
        String(req.params.userId),
        clientIp(req),
      );
      res.status(200).json({ success: true, data });
    }),

    updateUserStatus: asyncHandler(async (req, res: Response) => {
      const data = await adminService.updateUserStatus(
        requireAdminId(req),
        String(req.params.userId),
        req.body as { status: UserStatus; reason?: string },
        clientIp(req),
      );
      res.status(200).json({ success: true, data });
    }),

    listAuditLogs: asyncHandler(async (req, res: Response) => {
      const query = req.validatedQuery ?? req.query;
      const data = await adminService.listAuditLogs({
        adminId: query.adminId ? String(query.adminId) : undefined,
        action: query.action ? String(query.action) : undefined,
        targetType: query.targetType ? String(query.targetType) : undefined,
        identityAccessed:
          query.identityAccessed !== undefined ? query.identityAccessed === "true" : undefined,
        from: query.from ? String(query.from) : undefined,
        to: query.to ? String(query.to) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
        cursor: query.cursor ? String(query.cursor) : undefined,
      });
      res.status(200).json({ success: true, data: data.items, meta: data.meta });
    }),

    listTags: asyncHandler(async (req, res: Response) => {
      const includeInactive = req.query.includeInactive === "true";
      const data = await adminService.listTags(includeInactive);
      res.status(200).json({ success: true, data });
    }),

    createTag: asyncHandler(async (req, res: Response) => {
      const data = await adminService.createTag(
        requireAdminId(req),
        req.body as CreateTagInput,
        clientIp(req),
      );
      res.status(201).json({ success: true, data });
    }),

    updateTag: asyncHandler(async (req, res: Response) => {
      const data = await adminService.updateTag(
        requireAdminId(req),
        String(req.params.tagId),
        req.body as UpdateTagInput,
        clientIp(req),
      );
      res.status(200).json({ success: true, data });
    }),
  };
}
