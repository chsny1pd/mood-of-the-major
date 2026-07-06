import type { Comment } from "../../domain/entities/Comment.js";

export interface AnonymousCommentDto {
  id: string;
  content: string;
  parentId: string | null;
  depth: number;
  reactionSummary: Record<string, number>;
  createdAt: string;
}

export function toAnonymousCommentDto(comment: Comment): AnonymousCommentDto {
  return {
    id: comment.id,
    content: comment.content,
    parentId: comment.parentId,
    depth: comment.depth,
    reactionSummary: comment.reactionSummary,
    createdAt: comment.createdAt.toISOString(),
  };
}

export function assertNoCommentIdentityFields(dto: AnonymousCommentDto): void {
  const serialized = JSON.stringify(dto);
  const forbidden = ["authorId", "userId", "email"];

  for (const field of forbidden) {
    if (serialized.includes(`"${field}"`)) {
      throw new Error(`Anonymous comment DTO leaked identity field: ${field}`);
    }
  }
}
