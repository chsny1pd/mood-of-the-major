import { z } from "zod";

const objectIdPattern = /^[a-f\d]{24}$/i;

export const registerSchema = z
  .object({
    email: z.string().trim().email().max(254).toLowerCase(),
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

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
