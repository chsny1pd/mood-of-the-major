import type { Report, CreateReportInput } from "../../../domain/entities/Report.js";
import type { ReactionTargetType } from "../../../domain/entities/Reaction.js";
import type { IReportRepository } from "../../../domain/ports/IReportRepository.js";
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
}
