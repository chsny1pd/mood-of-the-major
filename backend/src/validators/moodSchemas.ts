import { z } from "zod";
import {
  FEED_MAX_LIMIT,
  MAX_IMAGES_PER_MOOD,
  MOOD_CONTENT_MAX_LENGTH,
  MOOD_CONTENT_MIN_LENGTH,
} from "../domain/constants/moodConstants.js";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

export const createMoodSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(MOOD_CONTENT_MIN_LENGTH, "Content is required.")
      .max(MOOD_CONTENT_MAX_LENGTH, `Content must be at most ${MOOD_CONTENT_MAX_LENGTH} characters.`),
    facultyId: objectIdSchema.optional(),
    majorId: objectIdSchema.optional(),
    tagIds: z.array(objectIdSchema).min(1, "At least one tag is required."),
    primaryTagId: objectIdSchema,
    imageIds: z.array(objectIdSchema).max(MAX_IMAGES_PER_MOOD).optional(),
  })
  .strict();

export const feedQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(FEED_MAX_LIMIT).optional(),
    cursor: z.string().min(1).optional(),
    sort: z.enum(["newest", "most_reacted", "most_commented"]).optional(),
    tagSlug: z.string().trim().min(1).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    majorId: objectIdSchema.optional(),
  })
  .strict();

export const updateMoodSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(MOOD_CONTENT_MIN_LENGTH, "Content is required.")
      .max(MOOD_CONTENT_MAX_LENGTH, `Content must be at most ${MOOD_CONTENT_MAX_LENGTH} characters.`),
    tagIds: z.array(objectIdSchema).min(1, "At least one tag is required."),
    primaryTagId: objectIdSchema,
  })
  .strict();

export const moodIdParamSchema = z.object({
  moodId: objectIdSchema,
});
