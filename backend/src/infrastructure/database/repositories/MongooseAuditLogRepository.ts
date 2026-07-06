import type { AuditLog, CreateAuditLogInput } from "../../../domain/entities/AuditLog.js";
import type {
  AuditLogListQuery,
  IAuditLogRepository,
} from "../../../domain/ports/IAuditLogRepository.js";
import { AuditLogModel } from "../models/AuditLog.js";

function toAuditLog(doc: {
  _id: { toString(): string };
  adminId: { toString(): string };
  action: AuditLog["action"];
  targetType: string;
  targetId?: { toString(): string } | null;
  metadata?: Record<string, unknown>;
  identityAccessed: boolean;
  ipAddress?: string | null;
  createdAt: Date;
}): AuditLog {
  return {
    id: doc._id.toString(),
    adminId: doc.adminId.toString(),
    action: doc.action,
    targetType: doc.targetType,
    targetId: doc.targetId?.toString() ?? null,
    metadata: doc.metadata ?? {},
    identityAccessed: doc.identityAccessed,
    ipAddress: doc.ipAddress ?? null,
    createdAt: doc.createdAt,
  };
}

export class MongooseAuditLogRepository implements IAuditLogRepository {
  async append(input: CreateAuditLogInput): Promise<AuditLog> {
    const doc = await AuditLogModel.create({
      adminId: input.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: input.metadata ?? {},
      identityAccessed: input.identityAccessed ?? false,
      ipAddress: input.ipAddress ?? null,
    });

    return toAuditLog(doc.toObject());
  }

  async findMany(query: AuditLogListQuery): Promise<AuditLog[]> {
    const filter: Record<string, unknown> = {};

    if (query.adminId) filter.adminId = query.adminId;
    if (query.action) filter.action = query.action;
    if (query.targetType) filter.targetType = query.targetType;
    if (query.identityAccessed !== undefined) filter.identityAccessed = query.identityAccessed;

    if (query.from || query.to) {
      filter.createdAt = {
        ...(query.from ? { $gte: query.from } : {}),
        ...(query.to ? { $lte: query.to } : {}),
      };
    }

    if (query.cursorCreatedAt && query.cursorId) {
      filter.$or = [
        { createdAt: { $lt: query.cursorCreatedAt } },
        { createdAt: query.cursorCreatedAt, _id: { $lt: query.cursorId } },
      ];
    }

    const docs = await AuditLogModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(query.limit)
      .lean();

    return docs.map(toAuditLog);
  }

  async countActionsSince(adminId: string | null, since: Date): Promise<number> {
    const filter: Record<string, unknown> = { createdAt: { $gte: since } };
    if (adminId) filter.adminId = adminId;
    return AuditLogModel.countDocuments(filter);
  }

  async findRecent(limit: number): Promise<AuditLog[]> {
    const docs = await AuditLogModel.find().sort({ createdAt: -1 }).limit(limit).lean();
    return docs.map(toAuditLog);
  }
}
