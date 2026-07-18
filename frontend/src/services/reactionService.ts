import { apiClient } from "./apiClient";
import type { ReactionView } from "../types/engagement";

function normalizeReactionView(
  data: Pick<ReactionView, "targetType" | "targetId" | "reactionSummary"> &
    Partial<Pick<ReactionView, "userReactions">>,
): ReactionView {
  return {
    targetType: data.targetType,
    targetId: data.targetId,
    reactionSummary: data.reactionSummary,
    userReactions: data.userReactions ?? [],
  };
}

export async function fetchReactions(
  targetType: "mood" | "comment",
  targetId: string,
): Promise<ReactionView> {
  const response = await apiClient.get<{ success: true; data: ReactionView }>("/reactions", {
    params: { targetType, targetId },
  });
  return normalizeReactionView(response.data.data);
}

export async function toggleReaction(
  targetType: "mood" | "comment",
  targetId: string,
  emoji: string,
): Promise<ReactionView> {
  const response = await apiClient.put<{ success: true; data: ReactionView }>("/reactions", {
    targetType,
    targetId,
    emoji,
  });
  return normalizeReactionView(response.data.data);
}

export async function removeReaction(
  targetType: "mood" | "comment",
  targetId: string,
  emoji: string,
): Promise<ReactionView> {
  const response = await apiClient.delete<{ success: true; data: ReactionView }>("/reactions", {
    data: { targetType, targetId, emoji },
  });
  return normalizeReactionView(response.data.data);
}
