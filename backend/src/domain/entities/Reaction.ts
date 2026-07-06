import type { ReactionType } from "../constants/engagementConstants.js";

export type ReactionTargetType = "mood" | "comment";

export interface Reaction {
  id: string;
  userId: string;
  targetType: ReactionTargetType;
  targetId: string;
  reactionType: ReactionType;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertReactionInput {
  userId: string;
  targetType: ReactionTargetType;
  targetId: string;
  reactionType: ReactionType;
}

export interface RemoveReactionInput {
  userId: string;
  targetType: ReactionTargetType;
  targetId: string;
}
