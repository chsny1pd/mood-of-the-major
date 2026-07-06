import type {
  Reaction,
  RemoveReactionInput,
  ReactionTargetType,
  UpsertReactionInput,
} from "../entities/Reaction.js";
import type { ReactionType } from "../constants/engagementConstants.js";

export interface ReactionUpsertResult {
  reactionType: ReactionType | null;
  reactionSummary: Record<string, number>;
}

export interface IReactionRepository {
  upsert(input: UpsertReactionInput): Promise<ReactionUpsertResult>;
  remove(input: RemoveReactionInput): Promise<ReactionUpsertResult>;
  findUserReaction(
    userId: string,
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<ReactionType | null>;
  getReactionSummary(
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<Record<string, number>>;
}

export type { Reaction };
