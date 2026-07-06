import { apiClient } from "./apiClient";
import type { AnonymousComment, PaginatedComments } from "../types/engagement";

export async function fetchComments(
  moodId: string,
  params: { limit?: number; cursor?: string; sort?: "oldest" | "newest" } = {},
): Promise<PaginatedComments> {
  const response = await apiClient.get<{
    success: true;
    data: AnonymousComment[];
    meta: PaginatedComments["meta"];
  }>(`/moods/${moodId}/comments`, { params });

  return { data: response.data.data, meta: response.data.meta };
}

export async function createComment(
  moodId: string,
  payload: { content: string; parentId?: string | null },
): Promise<AnonymousComment> {
  const response = await apiClient.post<{ success: true; data: AnonymousComment }>(
    `/moods/${moodId}/comments`,
    payload,
  );
  return response.data.data;
}

export async function deleteComment(commentId: string): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`);
}
