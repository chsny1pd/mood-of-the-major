import {
  ADMIN_DEFAULT_PAGE_LIMIT,
  ADMIN_MAX_PAGE_LIMIT,
  AUDIT_LOG_MAX_PAGE_LIMIT,
  CONTENT_PREVIEW_MAX_LENGTH,
} from "../../domain/constants/adminConstants.js";
import type { ReportStatus } from "../../domain/entities/Report.js";
import type { ReactionTargetType } from "../../domain/entities/Reaction.js";
import type { UserRole, UserStatus } from "../../domain/entities/User.js";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../domain/errors/AppError.js";
import type { IAuditLogRepository } from "../../domain/ports/IAuditLogRepository.js";
import type { ICommentRepository } from "../../domain/ports/ICommentRepository.js";
import type { IFacultyRepository } from "../../domain/ports/IFacultyRepository.js";
import type { IMoodRepository } from "../../domain/ports/IMoodRepository.js";
import type { IReportRepository, ResolveReportInput } from "../../domain/ports/IReportRepository.js";
import type { CreateTagInput, ITagRepository, UpdateTagInput } from "../../domain/ports/ITagRepository.js";
import type { IUserRepository } from "../../domain/ports/IUserRepository.js";
import { buildNextCursor, decodeCursor } from "../../utils/cursorPagination.js";
import type { NotificationService } from "./NotificationService.js";
import type { SubmissionService } from "./SubmissionService.js";
import type { SubmissionType } from "../../domain/constants/approvalConstants.js";

function truncatePreview(text: string): string {
  if (text.length <= CONTENT_PREVIEW_MAX_LENGTH) return text;
  return `${text.slice(0, CONTENT_PREVIEW_MAX_LENGTH)}…`;
}

export class AdminService {
  constructor(
    private readonly users: IUserRepository,
    private readonly moods: IMoodRepository,
    private readonly comments: ICommentRepository,
    private readonly reports: IReportRepository,
    private readonly tags: ITagRepository,
    private readonly faculties: IFacultyRepository,
    private readonly auditLogs: IAuditLogRepository,
    private readonly notifications: NotificationService,
    private readonly submissions: SubmissionService,
  ) {}

  async getDashboard() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sinceToday = new Date();
    sinceToday.setUTCHours(0, 0, 0, 0);

    const [
      openReports,
      actionsToday,
      activeUsers24h,
      moodsCreated24h,
      recentActions,
      totalUsers,
      totalPosts,
      totalFaculties,
      totalMajors,
      totalMoods,
      pendingSubmissions,
    ] = await Promise.all([
      this.reports.countPending(),
      this.auditLogs.countActionsSince(null, sinceToday),
      this.users.countActiveSince(since24h),
      this.moods.countCreatedSince(since24h),
      this.auditLogs.findRecent(5),
      this.users.countAll(),
      this.moods.countActive(),
      this.submissions.countApprovedFaculties(),
      this.submissions.countApprovedMajors(),
      this.submissions.countApprovedTags(),
      this.submissions.countPending(),
    ]);

    const adminEmails = await this.loadAdminEmails(recentActions.map((log) => log.adminId));

    return {
      openReports,
      actionsToday,
      activeUsers24h,
      moodsCreated24h,
      totalUsers,
      totalPosts,
      totalFaculties,
      totalMajors,
      totalMoods,
      pendingSubmissions,
      recentActions: recentActions.map((log) => ({
        id: log.id,
        adminId: log.adminId,
        adminEmail: adminEmails.get(log.adminId) ?? null,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        identityAccessed: log.identityAccessed,
        createdAt: log.createdAt.toISOString(),
      })),
    };
  }

  async listReports(input: {
    status?: ReportStatus;
    targetType?: ReactionTargetType;
    limit?: number;
    cursor?: string;
  }) {
    const limit = Math.min(input.limit ?? ADMIN_DEFAULT_PAGE_LIMIT, ADMIN_MAX_PAGE_LIMIT);
    const cursor = input.cursor ? decodeCursor(input.cursor) : null;

    const reports = await this.reports.findManyAdmin({
      status: input.status,
      targetType: input.targetType,
      limit,
      cursorCreatedAt: cursor ? new Date(cursor.createdAt) : undefined,
      cursorId: cursor?.id,
    });

    const pendingCount = await this.reports.countPending();
    const { nextCursor, hasMore } = buildNextCursor(reports, limit);

    const items = await Promise.all(
      reports.map(async (report) => ({
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        reasonCode: report.reasonCode,
        description: report.description,
        status: report.status,
        contentPreview: await this.getContentPreview(report.targetType, report.targetId),
        createdAt: report.createdAt.toISOString(),
      })),
    );

    return {
      items,
      meta: { pendingCount, limit, nextCursor, hasMore },
    };
  }

  async getReportDetail(adminId: string, reportId: string, ipAddress?: string | null) {
    const report = await this.reports.findById(reportId);
    if (!report) {
      throw new NotFoundError("Report not found", "RESOURCE_NOT_FOUND");
    }

    await this.auditLogs.append({
      adminId,
      action: "identity.view",
      targetType: "report",
      targetId: reportId,
      identityAccessed: true,
      metadata: { reporterId: report.reporterId },
      ipAddress,
    });

    const content = await this.getTargetContent(report.targetType, report.targetId);

    return {
      id: report.id,
      reporterId: report.reporterId,
      targetType: report.targetType,
      targetId: report.targetId,
      reasonCode: report.reasonCode,
      description: report.description,
      status: report.status,
      resolutionNote: report.resolutionNote,
      resolvedAt: report.resolvedAt?.toISOString() ?? null,
      createdAt: report.createdAt.toISOString(),
      content,
    };
  }

  async resolveReport(
    adminId: string,
    reportId: string,
    input: ResolveReportInput,
    ipAddress?: string | null,
  ) {
    const report = await this.reports.findById(reportId);
    if (!report) {
      throw new NotFoundError("Report not found", "RESOURCE_NOT_FOUND");
    }

    if (report.status !== "pending") {
      throw new ConflictError("Report already resolved", "REPORT_ALREADY_RESOLVED");
    }

    const shouldRemove =
      input.removeContent === true || input.status === "resolved_removed";

    if (shouldRemove) {
      await this.removeTargetContent(adminId, report.targetType, report.targetId, ipAddress);
    }

    const updated = await this.reports.resolve(reportId, adminId, input);
    if (!updated) {
      throw new ConflictError("Report already resolved", "REPORT_ALREADY_RESOLVED");
    }

    await this.auditLogs.append({
      adminId,
      action: "report.resolve",
      targetType: "report",
      targetId: reportId,
      metadata: {
        status: input.status,
        removeContent: shouldRemove,
        targetType: report.targetType,
        targetId: report.targetId,
      },
      ipAddress,
    });

    await this.notifications.notify({
      userId: report.reporterId,
      type: "report_resolved",
      title: "Your report was reviewed",
      body: "An administrator reviewed your report. Thank you for helping keep the community safe.",
      relatedEntityType: "report",
      relatedEntityId: reportId,
    });

    return {
      id: updated.id,
      status: updated.status,
      resolutionNote: updated.resolutionNote,
      resolvedAt: updated.resolvedAt?.toISOString() ?? null,
    };
  }

  async getMoodAdmin(adminId: string, moodId: string, ipAddress?: string | null) {
    const mood = await this.moods.findByIdIncludingRemoved(moodId);
    if (!mood) {
      throw new NotFoundError("Mood not found", "RESOURCE_NOT_FOUND");
    }

    const author = await this.users.findById(mood.authorId);

    await this.auditLogs.append({
      adminId,
      action: "identity.view",
      targetType: "mood",
      targetId: moodId,
      identityAccessed: true,
      metadata: { authorId: mood.authorId },
      ipAddress,
    });

    return {
      id: mood.id,
      content: mood.content,
      authorId: mood.authorId,
      authorEmail: author?.email ?? null,
      status: mood.status,
      reportCount: mood.reportCount,
      tags: mood.tagDetails.map((tag) => ({
        id: tag.id,
        slug: tag.slug,
        name: tag.name,
        isPrimary: tag.isPrimary,
      })),
      createdAt: mood.createdAt.toISOString(),
    };
  }

  async removeMood(
    adminId: string,
    moodId: string,
    input: { reason?: string; moderationNote?: string },
    ipAddress?: string | null,
  ) {
    const mood = await this.moods.findByIdIncludingRemoved(moodId);
    if (!mood) {
      throw new NotFoundError("Mood not found", "RESOURCE_NOT_FOUND");
    }

    if (mood.status === "moderated_removed") {
      throw new ConflictError("Mood already removed", "MOOD_ALREADY_REMOVED");
    }

    const note = input.moderationNote?.trim() || input.reason?.trim() || null;
    const updated = await this.moods.moderateRemove(moodId, adminId, note);
    if (!updated) {
      throw new NotFoundError("Mood not found", "RESOURCE_NOT_FOUND");
    }

    await this.auditLogs.append({
      adminId,
      action: "mood.remove",
      targetType: "mood",
      targetId: moodId,
      identityAccessed: true,
      metadata: { priorStatus: mood.status, reason: input.reason ?? null },
      ipAddress,
    });

    await this.notifications.notify({
      userId: mood.authorId,
      type: "content_moderated",
      title: "Your post was removed",
      body: "An administrator removed one of your posts for violating community guidelines.",
      relatedEntityType: "mood",
      relatedEntityId: moodId,
    });

    return { id: updated.id, status: updated.status };
  }

  async listContentMoods(input: {
    status?: string;
    minReportCount?: number;
    limit?: number;
    cursor?: string;
  }) {
    const limit = Math.min(input.limit ?? ADMIN_DEFAULT_PAGE_LIMIT, ADMIN_MAX_PAGE_LIMIT);
    const cursor = input.cursor ? decodeCursor(input.cursor) : null;

    const moods = await this.moods.findAdminContentList({
      status: input.status as import("../../domain/entities/Mood.js").Mood["status"] | undefined,
      minReportCount: input.minReportCount,
      limit,
      cursorCreatedAt: cursor ? new Date(cursor.createdAt) : undefined,
      cursorId: cursor?.id,
    });

    const { nextCursor, hasMore } = buildNextCursor(moods, limit);

    return {
      items: moods.map((mood) => ({
        id: mood.id,
        contentPreview: truncatePreview(mood.content),
        status: mood.status,
        reportCount: mood.reportCount,
        commentCount: mood.commentCount,
        createdAt: mood.createdAt.toISOString(),
      })),
      meta: { limit, nextCursor, hasMore },
    };
  }

  async listUsers(input: {
    status?: UserStatus;
    role?: string;
    q?: string;
    limit?: number;
    cursor?: string;
  }) {
    const limit = Math.min(input.limit ?? ADMIN_DEFAULT_PAGE_LIMIT, ADMIN_MAX_PAGE_LIMIT);
    const cursor = input.cursor ? decodeCursor(input.cursor) : null;

    const users = await this.users.findManyAdmin({
      status: input.status,
      role: input.role as import("../../domain/entities/User.js").UserRole | undefined,
      q: input.q,
      limit,
      cursorCreatedAt: cursor ? new Date(cursor.createdAt) : undefined,
      cursorId: cursor?.id,
    });

    const { nextCursor, hasMore } = buildNextCursor(users, limit);

    const items = await Promise.all(
      users.map(async (user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        faculty: user.facultyId
          ? await this.faculties.findActiveById(user.facultyId)
          : null,
        major: user.majorId ? await this.faculties.findActiveMajorByIdOnly(user.majorId) : null,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      })),
    );

    return { items, meta: { limit, nextCursor, hasMore } };
  }

  async getUserDetail(adminId: string, userId: string, ipAddress?: string | null) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found", "RESOURCE_NOT_FOUND");
    }

    await this.auditLogs.append({
      adminId,
      action: "identity.view",
      targetType: "user",
      targetId: userId,
      identityAccessed: true,
      ipAddress,
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      faculty: user.facultyId ? await this.faculties.findActiveById(user.facultyId) : null,
      major: user.majorId ? await this.faculties.findActiveMajorByIdOnly(user.majorId) : null,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    };
  }

  async updateUserStatus(
    adminId: string,
    userId: string,
    input: { status: UserStatus; reason?: string },
    ipAddress?: string | null,
  ) {
    if (input.status !== "active" && input.status !== "suspended") {
      throw new ValidationError("Invalid status", [
        { field: "status", message: "Status must be active or suspended." },
      ]);
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found", "RESOURCE_NOT_FOUND");
    }

    if (user.role === "administrator") {
      throw new ConflictError("Cannot suspend administrators", "ADMIN_PROTECTED");
    }

    const updated = await this.users.updateStatus(userId, input.status);
    if (!updated) {
      throw new NotFoundError("User not found", "RESOURCE_NOT_FOUND");
    }

    await this.auditLogs.append({
      adminId,
      action: input.status === "suspended" ? "user.suspend" : "user.reinstate",
      targetType: "user",
      targetId: userId,
      identityAccessed: true,
      metadata: { priorStatus: user.status, reason: input.reason ?? null },
      ipAddress,
    });

    if (input.status === "suspended") {
      await this.users.incrementTokenVersion(userId);
    }

    return {
      id: updated.id,
      status: updated.status,
    };
  }

  async updateUserRole(
    adminId: string,
    userId: string,
    input: { role: UserRole },
    ipAddress?: string | null,
  ) {
    if (adminId === userId) {
      throw new ConflictError("Cannot change your own role", "CANNOT_CHANGE_OWN_ROLE");
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found", "RESOURCE_NOT_FOUND");
    }

    if (user.role === input.role) {
      return {
        id: user.id,
        role: user.role,
      };
    }

    if (user.role === "administrator" && input.role !== "administrator") {
      const adminCount = await this.users.countByRole("administrator");
      if (adminCount <= 1) {
        throw new ConflictError("Cannot demote the last administrator", "LAST_ADMIN_PROTECTED");
      }
    }

    const updated = await this.users.updateRole(userId, input.role);
    if (!updated) {
      throw new NotFoundError("User not found", "RESOURCE_NOT_FOUND");
    }

    await this.auditLogs.append({
      adminId,
      action: "user.role_change",
      targetType: "user",
      targetId: userId,
      identityAccessed: true,
      metadata: { priorRole: user.role, newRole: input.role },
      ipAddress,
    });

    return {
      id: updated.id,
      role: updated.role,
    };
  }

  async listAuditLogs(input: {
    adminId?: string;
    action?: string;
    targetType?: string;
    identityAccessed?: boolean;
    from?: string;
    to?: string;
    limit?: number;
    cursor?: string;
  }) {
    const limit = Math.min(input.limit ?? ADMIN_DEFAULT_PAGE_LIMIT, AUDIT_LOG_MAX_PAGE_LIMIT);
    const cursor = input.cursor ? decodeCursor(input.cursor) : null;

    const logs = await this.auditLogs.findMany({
      adminId: input.adminId,
      action: input.action as import("../../domain/constants/adminConstants.js").AuditAction | undefined,
      targetType: input.targetType,
      identityAccessed: input.identityAccessed,
      from: input.from ? new Date(input.from) : undefined,
      to: input.to ? new Date(input.to) : undefined,
      limit,
      cursorCreatedAt: cursor ? new Date(cursor.createdAt) : undefined,
      cursorId: cursor?.id,
    });

    const adminEmails = await this.loadAdminEmails(logs.map((log) => log.adminId));
    const { nextCursor, hasMore } = buildNextCursor(logs, limit);

    return {
      items: logs.map((log) => ({
        id: log.id,
        adminId: log.adminId,
        adminEmail: adminEmails.get(log.adminId) ?? null,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        identityAccessed: log.identityAccessed,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString(),
      })),
      meta: { limit, nextCursor, hasMore },
    };
  }

  async listTags(includeInactive = false) {
    const tags = await this.tags.findAllAdmin("emotion", includeInactive);
    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      colorToken: tag.colorToken,
      iconKey: tag.iconKey,
      isActive: tag.isActive,
      sortOrder: tag.sortOrder,
    }));
  }

  async createTag(adminId: string, input: CreateTagInput, ipAddress?: string | null) {
    const existing = await this.tags.findActiveBySlug(input.slug);
    if (existing) {
      throw new ConflictError("Tag slug already exists", "TAG_SLUG_EXISTS");
    }

    const tag = await this.tags.create(input);

    await this.auditLogs.append({
      adminId,
      action: "tag.create",
      targetType: "tag",
      targetId: tag.id,
      metadata: { slug: tag.slug },
      ipAddress,
    });

    return tag;
  }

  async updateTag(
    adminId: string,
    tagId: string,
    input: UpdateTagInput,
    ipAddress?: string | null,
  ) {
    const updated = await this.tags.update(tagId, input);
    if (!updated) {
      throw new NotFoundError("Tag not found", "RESOURCE_NOT_FOUND");
    }

    await this.auditLogs.append({
      adminId,
      action: "tag.update",
      targetType: "tag",
      targetId: tagId,
      metadata: input as Record<string, unknown>,
      ipAddress,
    });

    return updated;
  }

  private async removeTargetContent(
    adminId: string,
    targetType: ReactionTargetType,
    targetId: string,
    ipAddress?: string | null,
  ) {
    if (targetType === "mood") {
      await this.removeMood(adminId, targetId, { reason: "Report resolution" }, ipAddress);
      return;
    }

    const comment = await this.comments.findById(targetId);
    if (!comment || comment.status !== "active") return;

    const removed = await this.comments.moderateRemove(targetId, adminId);
    if (!removed) return;

    await this.moods.decrementCommentCount(comment.moodId);

    await this.auditLogs.append({
      adminId,
      action: "comment.remove",
      targetType: "comment",
      targetId,
      identityAccessed: true,
      metadata: { moodId: comment.moodId },
      ipAddress,
    });

    await this.notifications.notify({
      userId: comment.authorId,
      type: "content_moderated",
      title: "Your comment was removed",
      body: "An administrator removed one of your comments for violating community guidelines.",
      relatedEntityType: "comment",
      relatedEntityId: targetId,
    });
  }

  private async getContentPreview(targetType: ReactionTargetType, targetId: string) {
    const content = await this.getTargetContent(targetType, targetId);
    return content ? truncatePreview(content.body) : null;
  }

  private async getTargetContent(targetType: ReactionTargetType, targetId: string) {
    if (targetType === "mood") {
      const mood = await this.moods.findByIdIncludingRemoved(targetId);
      if (!mood) return null;
      return { type: "mood" as const, body: mood.content, status: mood.status };
    }

    const comment = await this.comments.findById(targetId);
    if (!comment) return null;
    return { type: "comment" as const, body: comment.content, status: comment.status };
  }

  async listPendingSubmissions(type?: SubmissionType) {
    const items = await this.submissions.listPending(type);
    return { items, meta: { pendingCount: items.length } };
  }

  async updatePendingSubmission(
    type: SubmissionType,
    id: string,
    input: { name?: string; nameTh?: string | null; facultyId?: string },
  ) {
    const updated = await this.submissions.updatePending(type, id, input);
    if (!updated) {
      throw new NotFoundError("Pending submission not found", "RESOURCE_NOT_FOUND");
    }
    return updated;
  }

  async approveSubmission(type: SubmissionType, id: string) {
    const approved = await this.submissions.approve(type, id);
    if (!approved) {
      throw new NotFoundError("Pending submission not found", "RESOURCE_NOT_FOUND");
    }
    return approved;
  }

  async rejectSubmission(type: SubmissionType, id: string) {
    const rejected = await this.submissions.reject(type, id);
    if (!rejected) {
      throw new NotFoundError("Pending submission not found", "RESOURCE_NOT_FOUND");
    }
    return rejected;
  }

  listFacultiesAdmin() {
    return this.submissions.listFacultiesAdmin();
  }

  listMajorsAdmin() {
    return this.submissions.listMajorsAdmin();
  }

  listMoodsAdmin() {
    return this.submissions.listTagsAdmin();
  }

  private async loadAdminEmails(adminIds: string[]) {
    const unique = [...new Set(adminIds)];
    const map = new Map<string, string>();

    await Promise.all(
      unique.map(async (id) => {
        const user = await this.users.findById(id);
        if (user) map.set(id, user.email);
      }),
    );

    return map;
  }
}
