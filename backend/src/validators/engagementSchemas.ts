import { z } from "zod";
import {
  COMMENT_CONTENT_MAX_LENGTH,
  COMMENT_CONTENT_MIN_LENGTH,
  EMOJI_MAX_LENGTH,
  REPORT_DESCRIPTION_MAX_LENGTH,
  REPORT_REASON_CODES,
  SEARCH_QUERY_MIN_LENGTH,
} from "../domain/constants/engagementConstants.js";

export const createCommentSchema = z.object({
  content: z.string().trim().min(COMMENT_CONTENT_MIN_LENGTH).max(COMMENT_CONTENT_MAX_LENGTH),
  parentId: z.string().min(1).nullable().optional(),
});

export const commentListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
  cursor: z.string().min(1).optional(),
  sort: z.enum(["oldest", "newest"]).optional(),
});

export const commentIdParamSchema = z.object({
  commentId: z.string().min(1),
});

export const moodIdParamSchema = z.object({
  moodId: z.string().min(1),
});

export const upsertReactionSchema = z.object({
  targetType: z.enum(["mood", "comment"]),
  targetId: z.string().min(1),
  emoji: z.string().trim().min(1).max(EMOJI_MAX_LENGTH),
});

export const removeReactionSchema = z.object({
  targetType: z.enum(["mood", "comment"]),
  targetId: z.string().min(1),
  emoji: z.string().trim().min(1).max(EMOJI_MAX_LENGTH),
});

export const reactionQuerySchema = z.object({
  targetType: z.enum(["mood", "comment"]),
  targetId: z.string().min(1),
});

export const createBookmarkSchema = z.object({
  moodId: z.string().min(1),
});

export const bookmarkMoodIdParamSchema = z.object({
  moodId: z.string().min(1),
});

export const bookmarkListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional(),
  cursor: z.string().min(1).optional(),
});

export const submitReportSchema = z.object({
  reasonCode: z.enum(REPORT_REASON_CODES),
  description: z.string().trim().max(REPORT_DESCRIPTION_MAX_LENGTH).optional(),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(SEARCH_QUERY_MIN_LENGTH),
  facultyId: z.string().min(1).optional(),
  majorId: z.string().min(1).optional(),
  tagSlug: z.string().min(1).optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  cursor: z.string().min(1).optional(),
});
