import { apiClient } from "./apiClient";
import type { ReportReasonCode } from "../types/engagement";

export async function reportMood(
  moodId: string,
  payload: { reasonCode: ReportReasonCode; description?: string },
): Promise<{ message: string }> {
  const response = await apiClient.post<{ success: true; data: { message: string } }>(
    `/moods/${moodId}/report`,
    payload,
  );
  return response.data.data;
}

export async function reportComment(
  commentId: string,
  payload: { reasonCode: ReportReasonCode; description?: string },
): Promise<{ message: string }> {
  const response = await apiClient.post<{ success: true; data: { message: string } }>(
    `/comments/${commentId}/report`,
    payload,
  );
  return response.data.data;
}
