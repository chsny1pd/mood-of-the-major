import type {
  Reaction,
  ReactionMutationResult,
  RemoveReactionInput,
  ReactionTargetType,
  ToggleReactionInput,
} from "../entities/Reaction.js";

export interface IReactionRepository {
  toggle(input: ToggleReactionInput): Promise<ReactionMutationResult>;
  remove(input: RemoveReactionInput): Promise<ReactionMutationResult>;
  findUserReactions(
    userId: string,
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<string[]>;
  countUserReactions(
    userId: string,
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<number>;
  getReactionSummary(
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<Record<string, number>>;
}

export type { Reaction };
