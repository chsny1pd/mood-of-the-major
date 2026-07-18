import { z } from "zod";

const objectIdPattern = /^[a-f\d]{24}$/i;

export const registerSchema = z
  .object({
    email: z.string().trim().email().max(254).toLowerCase(),
    studentId: z
      .string()
      .trim()
      .min(5, "Student ID must be at least 5 characters")
      .max(20, "Student ID must be at most 20 characters")
      .regex(/^[A-Za-z0-9]+$/, "Student ID may only contain letters and numbers")
      .transform((value) => value.toUpperCase()),
    yearOfStudy: z.coerce
      .number()
      .int("Year must be a whole number")
      .min(1, "Year must be at least 1")
      .max(8, "Year must be at most 8"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/\d/, "Password must contain at least one number"),
    facultyId: z.string().regex(objectIdPattern, "Invalid facultyId").optional(),
    majorId: z.string().regex(objectIdPattern, "Invalid majorId").optional(),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().email().max(254).toLowerCase(),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(80).nullable().optional(),
    realName: z.string().trim().min(1).max(80).nullable().optional(),
    birthYear: z
      .number()
      .int()
      .min(1950)
      .max(new Date().getUTCFullYear())
      .nullable()
      .optional(),
    avatarUrl: z.string().url().max(2048).nullable().optional(),
    facultyId: z.string().regex(objectIdPattern, "Invalid facultyId").nullable().optional(),
    majorId: z.string().regex(objectIdPattern, "Invalid majorId").nullable().optional(),
  })
  .strict();

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;
