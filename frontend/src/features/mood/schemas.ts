import { z } from "zod";

export const createMoodSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Share what's on your mind.")
    .max(5000, "Keep your post under 5000 characters."),
  facultyId: z.string().optional(),
  majorId: z.string().optional(),
  tagIds: z.array(z.string()).min(1, "Pick at least one emotion."),
  primaryTagId: z.string().min(1, "Pick a primary emotion."),
});

export type CreateMoodFormValues = z.infer<typeof createMoodSchema>;
