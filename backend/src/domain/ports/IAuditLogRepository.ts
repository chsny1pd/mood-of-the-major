import type { AuditLog, CreateAuditLogInput } from "../entities/AuditLog.js";
import type { AuditAction } from "../constants/adminConstants.js";

export interface AuditLogListQuery {
  adminId?: string;
  action?: AuditAction;
  targetType?: string;
  identityAccessed?: boolean;
  from?: Date;
  to?: Date;
  limit: number;
  cursorCreatedAt?: Date;
  cursorId?: string;
}

export interface IAuditLogRepository {
  append(input: CreateAuditLogInput): Promise<AuditLog>;
  findMany(query: AuditLogListQuery): Promise<AuditLog[]>;
  countActionsSince(adminId: string | null, since: Date): Promise<number>;
  findRecent(limit: number): Promise<AuditLog[]>;
}
