import { apiClient } from "./apiClient";
import type { AnonymousMood, CreateMoodPayload, PaginatedMoods } from "../types/mood";

export interface FeedParams {
  limit?: number;
  cursor?: string;
  sort?: "newest" | "most_reacted" | "most_commented";
  tagSlug?: string;
  facultyId?: string;
  majorId?: string;
}

export async function fetchMoodFeed(params: FeedParams = {}): Promise<PaginatedMoods> {
  const response = await apiClient.get<{ success: true; data: AnonymousMood[]; meta: PaginatedMoods["meta"] }>(
    "/moods/feed",
    { params },
  );

  return { data: response.data.data, meta: response.data.meta };
}

export async function fetchFacultyMoodFeed(
  facultyId: string,
  params: FeedParams = {},
): Promise<PaginatedMoods> {
  const response = await apiClient.get<{ success: true; data: AnonymousMood[]; meta: PaginatedMoods["meta"] }>(
    `/faculties/${facultyId}/moods`,
    { params },
  );

  return { data: response.data.data, meta: response.data.meta };
}

export async function fetchMajorMoodFeed(
  majorId: string,
  params: FeedParams = {},
): Promise<PaginatedMoods> {
  const response = await apiClient.get<{ success: true; data: AnonymousMood[]; meta: PaginatedMoods["meta"] }>(
    `/majors/${majorId}/moods`,
    { params },
  );

  return { data: response.data.data, meta: response.data.meta };
}

export async function fetchMoodById(moodId: string): Promise<AnonymousMood> {
  const response = await apiClient.get<{ success: true; data: AnonymousMood }>(`/moods/${moodId}`);
  return response.data.data;
}

export async function createMood(payload: CreateMoodPayload): Promise<AnonymousMood> {
  const response = await apiClient.post<{ success: true; data: AnonymousMood }>("/moods", payload);
  return response.data.data;
}

export async function deleteMood(moodId: string): Promise<void> {
  await apiClient.delete(`/moods/${moodId}`);
}

export interface SearchParams {
  q: string;
  facultyId?: string;
  majorId?: string;
  tagSlug?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

export async function searchMoods(params: SearchParams): Promise<PaginatedMoods> {
  const response = await apiClient.get<{ success: true; data: AnonymousMood[]; meta: PaginatedMoods["meta"] }>(
    "/moods/search",
    { params },
  );

  return { data: response.data.data, meta: response.data.meta };
}
