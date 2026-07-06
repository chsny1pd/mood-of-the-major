import { REACTION_TYPES, type ReactionType } from "../../domain/constants/engagementConstants.js";
import type { ReactionTargetType } from "../../domain/entities/Reaction.js";
import { NotFoundError, ValidationError } from "../../domain/errors/AppError.js";
import type { ICommentRepository } from "../../domain/ports/ICommentRepository.js";
import type { IMoodRepository } from "../../domain/ports/IMoodRepository.js";
import type { IReactionRepository } from "../../domain/ports/IReactionRepository.js";

export interface UpsertReactionServiceInput {
  targetType: ReactionTargetType;
  targetId: string;
  reactionType: ReactionType;
}

export interface ReactionView {
  targetType: ReactionTargetType;
  targetId: string;
  reactionSummary: Record<string, number>;
  userReaction: ReactionType | null;
}

export class ReactionService {
  constructor(
    private readonly reactions: IReactionRepository,
    private readonly moods: IMoodRepository,
    private readonly comments: ICommentRepository,
  ) {}

  private async assertTargetExists(targetType: ReactionTargetType, targetId: string): Promise<void> {
    if (targetType === "mood") {
      const active = await this.moods.isActive(targetId);
      if (!active) throw new NotFoundError("Mood not found", "MOOD_NOT_FOUND");
      return;
    }

    const comment = await this.comments.findById(targetId);
    if (!comment) throw new NotFoundError("Comment not found", "COMMENT_NOT_FOUND");
  }

  async upsertReaction(userId: string, input: UpsertReactionServiceInput) {
    if (!REACTION_TYPES.includes(input.reactionType)) {
      throw new ValidationError("Invalid reaction type", [
        { field: "reactionType", message: "Reaction type is not allowed." },
      ]);
    }

    await this.assertTargetExists(input.targetType, input.targetId);

    const result = await this.reactions.upsert({
      userId,
      targetType: input.targetType,
      targetId: input.targetId,
      reactionType: input.reactionType,
    });

    return {
      targetType: input.targetType,
      targetId: input.targetId,
      reactionType: result.reactionType,
      reactionSummary: result.reactionSummary,
    };
  }

  async removeReaction(
    userId: string,
    targetType: ReactionTargetType,
    targetId: string,
  ) {
    await this.assertTargetExists(targetType, targetId);

    const result = await this.reactions.remove({ userId, targetType, targetId });

    return {
      targetType,
      targetId,
      reactionSummary: result.reactionSummary,
    };
  }

  async getReactions(
    targetType: ReactionTargetType,
    targetId: string,
    userId?: string,
  ): Promise<ReactionView> {
    await this.assertTargetExists(targetType, targetId);

    const reactionSummary = await this.reactions.getReactionSummary(targetType, targetId);
    const userReaction = userId
      ? await this.reactions.findUserReaction(userId, targetType, targetId)
      : null;

    return { targetType, targetId, reactionSummary, userReaction };
  }
}
