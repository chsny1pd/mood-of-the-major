import { apiClient } from "./apiClient";
import type { ReactionType, ReactionView } from "../types/engagement";

export async function fetchReactions(
  targetType: "mood" | "comment",
  targetId: string,
): Promise<ReactionView> {
  const response = await apiClient.get<{ success: true; data: ReactionView }>("/reactions", {
    params: { targetType, targetId },
  });
  return response.data.data;
}

export async function upsertReaction(
  targetType: "mood" | "comment",
  targetId: string,
  reactionType: ReactionType,
): Promise<ReactionView> {
  const response = await apiClient.put<{ success: true; data: ReactionView & { reactionType: ReactionType } }>(
    "/reactions",
    { targetType, targetId, reactionType },
  );

  return {
    targetType: response.data.data.targetType,
    targetId: response.data.data.targetId,
    reactionSummary: response.data.data.reactionSummary,
    userReaction: response.data.data.reactionType,
  };
}

export async function removeReaction(
  targetType: "mood" | "comment",
  targetId: string,
): Promise<ReactionView> {
  const response = await apiClient.delete<{ success: true; data: { reactionSummary: Record<string, number> } }>(
    "/reactions",
    { data: { targetType, targetId } },
  );

  return {
    targetType,
    targetId,
    reactionSummary: response.data.data.reactionSummary,
    userReaction: null,
  };
}
