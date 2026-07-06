import type { Response } from "express";
import type { ReportService, SubmitReportInput } from "../application/services/ReportService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AuthenticationError } from "../domain/errors/AppError.js";

export function createReportController(reportService: ReportService) {
  return {
    reportMood: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const result = await reportService.submitReport(
        req.userId,
        "mood",
        String(req.params.moodId),
        req.body as SubmitReportInput,
      );

      res.status(201).json({ success: true, data: result });
    }),

    reportComment: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const result = await reportService.submitReport(
        req.userId,
        "comment",
        String(req.params.commentId),
        req.body as SubmitReportInput,
      );

      res.status(201).json({ success: true, data: result });
    }),
  };
}
