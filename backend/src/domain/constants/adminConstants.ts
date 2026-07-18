export const AUDIT_ACTIONS = [
  "identity.view",
  "mood.remove",
  "comment.remove",
  "report.resolve",
  "user.suspend",
  "user.reinstate",
  "user.role_change",
  "tag.create",
  "tag.update",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const NOTIFICATION_TYPES = [
  "report_resolved",
  "content_moderated",
  "system",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const ADMIN_DEFAULT_PAGE_LIMIT = 20;
export const ADMIN_MAX_PAGE_LIMIT = 50;
export const AUDIT_LOG_MAX_PAGE_LIMIT = 50;
export const CONTENT_PREVIEW_MAX_LENGTH = 120;
