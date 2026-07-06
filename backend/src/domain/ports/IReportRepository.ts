import type { CreateReportInput, Report } from "../entities/Report.js";
import type { ReactionTargetType } from "../entities/Reaction.js";

export interface IReportRepository {
  create(input: CreateReportInput): Promise<Report>;
  hasRecentReport(
    reporterId: string,
    targetType: ReactionTargetType,
    targetId: string,
    since: Date,
  ): Promise<boolean>;
}
