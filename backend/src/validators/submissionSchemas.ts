import { z } from "zod";

const nameField = z.string().trim().min(2).max(120);

export const submitFacultySchema = z.object({
  name: nameField,
  nameTh: z.string().trim().max(120).nullable().optional(),
});

export const submitMajorSchema = z.object({
  facultyId: z.string().min(1),
  name: nameField,
  nameTh: z.string().trim().max(120).nullable().optional(),
});

export const submitTagSchema = z.object({
  name: nameField,
  nameTh: z.string().trim().max(120).nullable().optional(),
});

export const submissionTypeParamSchema = z.object({
  type: z.enum(["faculty", "major", "tag"]),
});

export const updatePendingSubmissionSchema = z.object({
  name: nameField.optional(),
  nameTh: z.string().trim().max(120).nullable().optional(),
  facultyId: z.string().min(1).optional(),
});

export const pendingListQuerySchema = z.object({
  type: z.enum(["faculty", "major", "tag"]).optional(),
});
