import { MAX_REACTIONS_PER_USER } from "../../domain/constants/engagementConstants.js";
import type { ReactionTargetType } from "../../domain/entities/Reaction.js";
import { AppError, NotFoundError, ValidationError } from "../../domain/errors/AppError.js";
import type { ICommentRepository } from "../../domain/ports/ICommentRepository.js";
import type { IMoodRepository } from "../../domain/ports/IMoodRepository.js";
import type { IReactionRepository } from "../../domain/ports/IReactionRepository.js";
import { isValidReactionEmoji } from "../../domain/utils/isValidReactionEmoji.js";

export interface ToggleReactionServiceInput {
  targetType: ReactionTargetType;
  targetId: string;
  emoji: string;
}

export interface ReactionView {
  targetType: ReactionTargetType;
  targetId: string;
  reactionSummary: Record<string, number>;
  userReactions: string[];
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

  async toggleReaction(userId: string, input: ToggleReactionServiceInput) {
    const emoji = input.emoji.trim();
    if (!isValidReactionEmoji(emoji)) {
      throw new ValidationError("Invalid reaction emoji", [
        { field: "emoji", message: "Must be a single emoji." },
      ]);
    }

    await this.assertTargetExists(input.targetType, input.targetId);

    const existing = await this.reactions.findUserReactions(
      userId,
      input.targetType,
      input.targetId,
    );
    if (!existing.includes(emoji)) {
      const count = await this.reactions.countUserReactions(
        userId,
        input.targetType,
        input.targetId,
      );
      if (count >= MAX_REACTIONS_PER_USER) {
        throw new AppError("Reaction limit reached", {
          statusCode: 422,
          code: "REACTION_LIMIT_REACHED",
        });
      }
    }

    const result = await this.reactions.toggle({
      userId,
      targetType: input.targetType,
      targetId: input.targetId,
      emoji,
    });

    return {
      targetType: input.targetType,
      targetId: input.targetId,
      ...result,
    };
  }

  async removeReaction(
    userId: string,
    targetType: ReactionTargetType,
    targetId: string,
    emoji: string,
  ) {
    await this.assertTargetExists(targetType, targetId);

    const result = await this.reactions.remove({ userId, targetType, targetId, emoji });

    return {
      targetType,
      targetId,
      ...result,
    };
  }

  async getReactions(
    targetType: ReactionTargetType,
    targetId: string,
    userId?: string,
  ): Promise<ReactionView> {
    await this.assertTargetExists(targetType, targetId);

    const reactionSummary = await this.reactions.getReactionSummary(targetType, targetId);
    const userReactions = userId
      ? await this.reactions.findUserReactions(userId, targetType, targetId)
      : [];

    return { targetType, targetId, reactionSummary, userReactions };
  }
}
