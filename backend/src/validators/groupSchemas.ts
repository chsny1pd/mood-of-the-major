import { z } from "zod";
import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_LIST_MAX_LIMIT,
  GROUP_NAME_MAX_LENGTH,
  GROUP_NAME_MIN_LENGTH,
} from "../domain/constants/groupConstants.js";
import { FEED_MAX_LIMIT, MAX_IMAGES_PER_MOOD, MOOD_CONTENT_MAX_LENGTH, MOOD_CONTENT_MIN_LENGTH } from "../domain/constants/moodConstants.js";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

export const createGroupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(GROUP_NAME_MIN_LENGTH)
      .max(GROUP_NAME_MAX_LENGTH),
    description: z.string().trim().max(GROUP_DESCRIPTION_MAX_LENGTH).optional(),
    coverImageUrl: z
      .string()
      .trim()
      .url()
      .refine((value) => /^https?:\/\//i.test(value), "Must be an http(s) URL")
      .nullable()
      .optional(),
  })
  .strict();

export const groupListQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),
    limit: z.coerce.number().int().min(1).max(GROUP_LIST_MAX_LIMIT).optional(),
    cursor: z.string().min(1).optional(),
  })
  .strict();

export const groupIdParamSchema = z.object({
  groupId: objectIdSchema,
});

export const groupMemberParamSchema = z.object({
  groupId: objectIdSchema,
  userId: objectIdSchema,
});

export const groupFeedQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(FEED_MAX_LIMIT).optional(),
    cursor: z.string().min(1).optional(),
  })
  .strict();

export const createGroupMoodSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(MOOD_CONTENT_MIN_LENGTH)
      .max(MOOD_CONTENT_MAX_LENGTH),
    facultyId: objectIdSchema.optional(),
    majorId: objectIdSchema.optional(),
    tagIds: z.array(objectIdSchema).min(1),
    primaryTagId: objectIdSchema,
    imageIds: z.array(objectIdSchema).max(MAX_IMAGES_PER_MOOD).optional(),
  })
  .strict();
