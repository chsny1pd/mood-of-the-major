import {
  COMMENT_CONTENT_MAX_LENGTH,
  COMMENT_CONTENT_MIN_LENGTH,
  COMMENT_MAX_THREAD_DEPTH,
  ENGAGEMENT_DEFAULT_LIMIT,
  ENGAGEMENT_MAX_LIMIT,
} from "../../domain/constants/engagementConstants.js";
import type { Comment } from "../../domain/entities/Comment.js";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../domain/errors/AppError.js";
import type { ICommentRepository } from "../../domain/ports/ICommentRepository.js";
import type { IMoodRepository } from "../../domain/ports/IMoodRepository.js";
import { buildNextCursor, decodeCursor } from "../../utils/cursorPagination.js";

export interface CreateCommentInput {
  content: string;
  parentId?: string | null;
}

export interface CommentListInput {
  moodId: string;
  limit?: number;
  cursor?: string;
  sort?: "oldest" | "newest";
}

export interface CommentListResult {
  items: Comment[];
  meta: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export class CommentService {
  constructor(
    private readonly comments: ICommentRepository,
    private readonly moods: IMoodRepository,
  ) {}

  async listComments(input: CommentListInput): Promise<CommentListResult> {
    const mood = await this.moods.findById(input.moodId);
    if (!mood) {
      throw new NotFoundError("Mood not found", "MOOD_NOT_FOUND");
    }

    const limit = Math.min(input.limit ?? ENGAGEMENT_DEFAULT_LIMIT, ENGAGEMENT_MAX_LIMIT);
    const cursor = input.cursor ? decodeCursor(input.cursor) : null;

    const items = await this.comments.findActiveByMood({
      moodId: input.moodId,
      limit,
      cursorCreatedAt: cursor ? new Date(cursor.createdAt) : undefined,
      cursorId: cursor?.id,
      sort: input.sort ?? "oldest",
    });

    const pagination = buildNextCursor(
      items.map((item) => ({ id: item.id, createdAt: item.createdAt })),
      limit,
    );

    return {
      items,
      meta: {
        limit,
        nextCursor: pagination.nextCursor,
        hasMore: pagination.hasMore,
      },
    };
  }

  async createComment(userId: string, moodId: string, input: CreateCommentInput): Promise<Comment> {
    const moodActive = await this.moods.isActive(moodId);
    if (!moodActive) {
      throw new NotFoundError("Mood not found", "MOOD_NOT_FOUND");
    }

    const content = input.content.trim();
    if (content.length < COMMENT_CONTENT_MIN_LENGTH || content.length > COMMENT_CONTENT_MAX_LENGTH) {
      throw new ValidationError("Invalid content", [
        {
          field: "content",
          message: `Content must be between ${COMMENT_CONTENT_MIN_LENGTH} and ${COMMENT_CONTENT_MAX_LENGTH} characters.`,
        },
      ]);
    }

    let depth = 0;
    if (input.parentId) {
      const parent = await this.comments.findActiveByIdOnMood(input.parentId, moodId);
      if (!parent) {
        throw new ValidationError("Invalid parent", [
          { field: "parentId", message: "Parent comment not found on this mood." },
        ]);
      }

      if (parent.depth >= COMMENT_MAX_THREAD_DEPTH) {
        throw new ValidationError("Thread depth exceeded", [
          { field: "parentId", message: "Maximum reply depth reached." },
        ]);
      }

      depth = parent.depth + 1;
    }

    const comment = await this.comments.create({
      moodId,
      authorId: userId,
      content,
      parentId: input.parentId ?? null,
      depth,
    });

    await this.moods.incrementCommentCount(moodId);
    return comment;
  }

  async getComment(commentId: string): Promise<Comment> {
    const comment = await this.comments.findById(commentId);
    if (!comment) {
      throw new NotFoundError("Comment not found", "COMMENT_NOT_FOUND");
    }

    return comment;
  }

  async deleteComment(userId: string, commentId: string, isAdmin: boolean): Promise<void> {
    const comment = await this.comments.findById(commentId);
    if (!comment) {
      throw new NotFoundError("Comment not found", "COMMENT_NOT_FOUND");
    }

    const isOwner = await this.comments.isAuthor(commentId, userId);
    if (!isOwner && !isAdmin) {
      throw new AuthorizationError("You can only delete your own comments");
    }

    const deleted = isAdmin
      ? await this.comments.softDelete(commentId)
      : await this.comments.softDeleteByAuthor(commentId, userId);

    if (deleted) {
      await this.moods.decrementCommentCount(comment.moodId);
    }
  }
}
