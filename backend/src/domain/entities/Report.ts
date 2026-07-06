import type { ReportReasonCode } from "../constants/engagementConstants.js";
import type { ReactionTargetType } from "./Reaction.js";

export type ReportStatus =
  | "pending"
  | "resolved_removed"
  | "resolved_dismissed"
  | "resolved_warned";

export interface Report {
  id: string;
  reporterId: string;
  targetType: ReactionTargetType;
  targetId: string;
  reasonCode: ReportReasonCode;
  description: string | null;
  status: ReportStatus;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReportInput {
  reporterId: string;
  targetType: ReactionTargetType;
  targetId: string;
  reasonCode: ReportReasonCode;
  description?: string | null;
}
