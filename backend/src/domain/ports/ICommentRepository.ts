import type { CreateCommentInput, Comment } from "../entities/Comment.js";

export interface CommentListQuery {
  moodId: string;
  limit: number;
  cursorCreatedAt?: Date;
  cursorId?: string;
  sort?: "oldest" | "newest";
}

export interface ICommentRepository {
  create(input: CreateCommentInput): Promise<Comment>;
  findById(id: string): Promise<Comment | null>;
  findActiveByMood(query: CommentListQuery): Promise<Comment[]>;
  softDeleteByAuthor(commentId: string, authorId: string): Promise<boolean>;
  softDelete(commentId: string): Promise<boolean>;
  moderateRemove(commentId: string, adminId: string): Promise<boolean>;
  isAuthor(commentId: string, authorId: string): Promise<boolean>;
  findActiveByIdOnMood(commentId: string, moodId: string): Promise<Comment | null>;
  findOwnedCommentIds(commentIds: string[], authorId: string): Promise<Set<string>>;
  adjustReactionSummary(commentId: string, reactionType: string, delta: number): Promise<Record<string, number>>;
}
