export type ReactionTargetType = "mood" | "comment";

export interface Reaction {
  id: string;
  userId: string;
  targetType: ReactionTargetType;
  targetId: string;
  emoji: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToggleReactionInput {
  userId: string;
  targetType: ReactionTargetType;
  targetId: string;
  emoji: string;
}

export interface RemoveReactionInput {
  userId: string;
  targetType: ReactionTargetType;
  targetId: string;
  emoji: string;
}

export interface ReactionMutationResult {
  emoji: string | null;
  toggledOn: boolean;
  reactionSummary: Record<string, number>;
  userReactions: string[];
}
