import type { CreateReportInput, Report, ReportStatus } from "../entities/Report.js";
import type { ReactionTargetType } from "../entities/Reaction.js";

export interface AdminReportListQuery {
  status?: ReportStatus;
  targetType?: ReactionTargetType;
  limit: number;
  cursorCreatedAt?: Date;
  cursorId?: string;
}

export interface ResolveReportInput {
  status: Exclude<ReportStatus, "pending">;
  resolutionNote?: string | null;
  removeContent?: boolean;
}

export interface IReportRepository {
  create(input: CreateReportInput): Promise<Report>;
  hasRecentReport(
    reporterId: string,
    targetType: ReactionTargetType,
    targetId: string,
    since: Date,
  ): Promise<boolean>;
  findById(id: string): Promise<Report | null>;
  findManyAdmin(query: AdminReportListQuery): Promise<Report[]>;
  countPending(): Promise<number>;
  resolve(
    reportId: string,
    adminId: string,
    input: ResolveReportInput,
  ): Promise<Report | null>;
}
