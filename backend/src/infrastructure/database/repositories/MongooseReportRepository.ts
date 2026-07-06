import type {
  CreateReportInput,
  Report,
} from "../../../domain/entities/Report.js";
import type { ReactionTargetType } from "../../../domain/entities/Reaction.js";
import type {
  AdminReportListQuery,
  IReportRepository,
  ResolveReportInput,
} from "../../../domain/ports/IReportRepository.js";
import { ReportModel } from "../models/Report.js";

function toReport(doc: {
  _id: { toString(): string };
  reporterId: { toString(): string };
  targetType: Report["targetType"];
  targetId: { toString(): string };
  reasonCode: Report["reasonCode"];
  description?: string | null;
  status: Report["status"];
  resolvedAt?: Date | null;
  resolvedBy?: { toString(): string } | null;
  resolutionNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Report {
  return {
    id: doc._id.toString(),
    reporterId: doc.reporterId.toString(),
    targetType: doc.targetType,
    targetId: doc.targetId.toString(),
    reasonCode: doc.reasonCode,
    description: doc.description ?? null,
    status: doc.status,
    resolvedAt: doc.resolvedAt ?? null,
    resolvedBy: doc.resolvedBy?.toString() ?? null,
    resolutionNote: doc.resolutionNote ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongooseReportRepository implements IReportRepository {
  async create(input: CreateReportInput): Promise<Report> {
    const doc = await ReportModel.create({
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reasonCode: input.reasonCode,
      description: input.description ?? null,
      status: "pending",
    });

    return toReport(doc.toObject());
  }

  async hasRecentReport(
    reporterId: string,
    targetType: ReactionTargetType,
    targetId: string,
    since: Date,
  ): Promise<boolean> {
    const count = await ReportModel.countDocuments({
      reporterId,
      targetType,
      targetId,
      createdAt: { $gte: since },
    });

    return count > 0;
  }

  async findById(id: string): Promise<Report | null> {
    const doc = await ReportModel.findById(id).lean();
    return doc ? toReport(doc) : null;
  }

  async findManyAdmin(query: AdminReportListQuery): Promise<Report[]> {
    const filter: Record<string, unknown> = {};

    if (query.status) {
      filter.status = query.status;
    } else {
      filter.status = "pending";
    }

    if (query.targetType) {
      filter.targetType = query.targetType;
    }

    if (query.cursorCreatedAt && query.cursorId) {
      filter.$or = [
        { createdAt: { $gt: query.cursorCreatedAt } },
        { createdAt: query.cursorCreatedAt, _id: { $gt: query.cursorId } },
      ];
    }

    const docs = await ReportModel.find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .limit(query.limit)
      .lean();

    return docs.map(toReport);
  }

  async countPending(): Promise<number> {
    return ReportModel.countDocuments({ status: "pending" });
  }

  async resolve(
    reportId: string,
    adminId: string,
    input: ResolveReportInput,
  ): Promise<Report | null> {
    const doc = await ReportModel.findOneAndUpdate(
      { _id: reportId, status: "pending" },
      {
        status: input.status,
        resolvedAt: new Date(),
        resolvedBy: adminId,
        resolutionNote: input.resolutionNote?.trim() ?? null,
      },
      { returnDocument: "after" },
    ).lean();

    return doc ? toReport(doc) : null;
  }
}
