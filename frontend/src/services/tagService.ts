import { apiClient } from "./apiClient";
import type { EmotionTag } from "../types/mood";

export async function fetchEmotionTags(): Promise<EmotionTag[]> {
  const response = await apiClient.get<{ success: true; data: EmotionTag[] }>("/tags");
  return response.data.data;
}
