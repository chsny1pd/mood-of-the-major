import {
  REPORT_COOLDOWN_MS,
  REPORT_DESCRIPTION_MAX_LENGTH,
  REPORT_REASON_CODES,
  type ReportReasonCode,
} from "../../domain/constants/engagementConstants.js";
import type { ReactionTargetType } from "../../domain/entities/Reaction.js";
import { ConflictError, NotFoundError, ValidationError } from "../../domain/errors/AppError.js";
import type { ICommentRepository } from "../../domain/ports/ICommentRepository.js";
import type { IMoodRepository } from "../../domain/ports/IMoodRepository.js";
import type { IReportRepository } from "../../domain/ports/IReportRepository.js";

export interface SubmitReportInput {
  reasonCode: ReportReasonCode;
  description?: string | null;
}

export class ReportService {
  constructor(
    private readonly reports: IReportRepository,
    private readonly moods: IMoodRepository,
    private readonly comments: ICommentRepository,
  ) {}

  private async assertTarget(
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<void> {
    if (targetType === "mood") {
      const mood = await this.moods.findByIdIncludingRemoved(targetId);
      if (!mood) throw new NotFoundError("Mood not found", "MOOD_NOT_FOUND");
      return;
    }

    const comment = await this.comments.findById(targetId);
    if (!comment) throw new NotFoundError("Comment not found", "COMMENT_NOT_FOUND");
  }

  async submitReport(
    reporterId: string,
    targetType: ReactionTargetType,
    targetId: string,
    input: SubmitReportInput,
  ) {
    if (!REPORT_REASON_CODES.includes(input.reasonCode)) {
      throw new ValidationError("Invalid reason", [
        { field: "reasonCode", message: "Reason code is not allowed." },
      ]);
    }

    const description = input.description?.trim() ?? null;
    if (description && description.length > REPORT_DESCRIPTION_MAX_LENGTH) {
      throw new ValidationError("Description too long", [
        {
          field: "description",
          message: `Description must be at most ${REPORT_DESCRIPTION_MAX_LENGTH} characters.`,
        },
      ]);
    }

    await this.assertTarget(targetType, targetId);

    const since = new Date(Date.now() - REPORT_COOLDOWN_MS);
    const hasRecent = await this.reports.hasRecentReport(
      reporterId,
      targetType,
      targetId,
      since,
    );

    if (hasRecent) {
      throw new ConflictError(
        "You have already reported this content recently",
        "REPORT_COOLDOWN",
      );
    }

    const report = await this.reports.create({
      reporterId,
      targetType,
      targetId,
      reasonCode: input.reasonCode,
      description,
    });

    if (targetType === "mood") {
      await this.moods.incrementReportCount(targetId);
    }

    return {
      id: report.id,
      status: report.status,
      message: "Thank you. Your report has been received.",
    };
  }
}
