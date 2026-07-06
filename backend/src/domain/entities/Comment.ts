export type CommentStatus = "active" | "moderated_removed" | "deleted_by_author";

export interface Comment {
  id: string;
  moodId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  status: CommentStatus;
  reactionSummary: Record<string, number>;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateCommentInput {
  moodId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  depth: number;
}
