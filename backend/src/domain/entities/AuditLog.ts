import type { AuditAction } from "../constants/adminConstants.js";

export interface AuditLog {
  id: string;
  adminId: string;
  action: AuditAction;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  identityAccessed: boolean;
  ipAddress: string | null;
  createdAt: Date;
}

export interface CreateAuditLogInput {
  adminId: string;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  identityAccessed?: boolean;
  ipAddress?: string | null;
}
