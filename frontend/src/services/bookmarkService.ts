import { apiClient } from "./apiClient";
import type { AnonymousMood, PaginatedMoods } from "../types/mood";

export async function addBookmark(moodId: string): Promise<void> {
  await apiClient.post("/bookmarks", { moodId });
}

export async function removeBookmark(moodId: string): Promise<void> {
  await apiClient.delete(`/bookmarks/${moodId}`);
}

export async function fetchBookmarks(params: {
  limit?: number;
  cursor?: string;
} = {}): Promise<PaginatedMoods> {
  const response = await apiClient.get<{
    success: true;
    data: AnonymousMood[];
    meta: PaginatedMoods["meta"];
  }>("/bookmarks", { params });

  return { data: response.data.data, meta: response.data.meta };
}

export async function fetchBookmarkStatus(moodId: string): Promise<boolean> {
  const response = await apiClient.get<{
    success: true;
    data: { moodId: string; bookmarked: boolean };
  }>(`/bookmarks/status/${moodId}`);

  return response.data.data.bookmarked;
}
