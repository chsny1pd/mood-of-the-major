import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  studentId: z
    .string()
    .trim()
    .min(5, "Student ID must be at least 5 characters")
    .max(20, "Student ID must be at most 20 characters")
    .regex(/^[A-Za-z0-9]+$/, "Student ID may only contain letters and numbers"),
  yearOfStudy: z
    .number({ error: "Select your year of study" })
    .int("Year must be a whole number")
    .min(1, "Select your year of study")
    .max(8, "Year must be at most 8"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/\d/, "Password must contain at least one number"),
  facultyId: z.string().optional(),
  majorId: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
