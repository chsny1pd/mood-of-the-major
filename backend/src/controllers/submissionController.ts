import type { Request, Response } from "express";
import type { SubmissionService } from "../application/services/SubmissionService.js";
import { AuthenticationError } from "../domain/errors/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  submitFacultySchema,
  submitMajorSchema,
  submitTagSchema,
} from "../validators/submissionSchemas.js";

function requireUserId(req: Request): string {
  if (!req.userId) {
    throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
  }
  return req.userId;
}

export function createSubmissionController(submissionService: SubmissionService) {
  return {
    submitFaculty: asyncHandler(async (req, res: Response) => {
      const body = submitFacultySchema.parse(req.body);
      const data = await submissionService.submitFaculty(requireUserId(req), body);
      res.status(201).json({ success: true, data });
    }),

    submitMajor: asyncHandler(async (req, res: Response) => {
      const body = submitMajorSchema.parse({
        facultyId: String(req.params.facultyId),
        name: (req.body as { name?: string }).name ?? "",
        nameTh: (req.body as { nameTh?: string | null }).nameTh,
      });
      const data = await submissionService.submitMajor(requireUserId(req), body);
      res.status(201).json({ success: true, data });
    }),

    submitTag: asyncHandler(async (req, res: Response) => {
      const body = submitTagSchema.parse(req.body);
      const data = await submissionService.submitTag(requireUserId(req), body);
      res.status(201).json({ success: true, data });
    }),
  };
}
