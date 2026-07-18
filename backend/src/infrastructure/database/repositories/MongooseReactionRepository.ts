import type {
  ReactionMutationResult,
  RemoveReactionInput,
  ReactionTargetType,
  ToggleReactionInput,
} from "../../../domain/entities/Reaction.js";
import { MAX_REACTIONS_PER_USER } from "../../../domain/constants/engagementConstants.js";
import { AppError } from "../../../domain/errors/AppError.js";
import type { IReactionRepository } from "../../../domain/ports/IReactionRepository.js";
import { CommentModel } from "../models/Comment.js";
import { MoodModel } from "../models/Mood.js";
import { ReactionModel } from "../models/Reaction.js";

async function getTargetSummary(
  targetType: ReactionTargetType,
  targetId: string,
): Promise<Record<string, number>> {
  if (targetType === "mood") {
    const mood = await MoodModel.findById(targetId).select("reactionSummary").lean();
    return (mood?.reactionSummary as Record<string, number>) ?? {};
  }

  const comment = await CommentModel.findById(targetId).select("reactionSummary").lean();
  return (comment?.reactionSummary as Record<string, number>) ?? {};
}

async function adjustTargetSummary(
  targetType: ReactionTargetType,
  targetId: string,
  emoji: string,
  delta: number,
): Promise<Record<string, number>> {
  const key = `reactionSummary.${emoji}`;

  if (targetType === "mood") {
    const updated = await MoodModel.findOneAndUpdate(
      { _id: targetId },
      {
        $inc: { [key]: delta, reactionCount: delta },
        $set: { lastActivityAt: new Date() },
      },
      { new: true },
    ).lean();
    return (updated?.reactionSummary as Record<string, number>) ?? {};
  }

  const updated = await CommentModel.findOneAndUpdate(
    { _id: targetId },
    { $inc: { [key]: delta } },
    { new: true },
  ).lean();

  return (updated?.reactionSummary as Record<string, number>) ?? {};
}

export class MongooseReactionRepository implements IReactionRepository {
  async toggle(input: ToggleReactionInput): Promise<ReactionMutationResult> {
    const existing = await ReactionModel.findOne({
      userId: input.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      emoji: input.emoji,
    });

    if (existing) {
      await existing.deleteOne();
      const reactionSummary = await adjustTargetSummary(
        input.targetType,
        input.targetId,
        input.emoji,
        -1,
      );
      const userReactions = await this.findUserReactions(
        input.userId,
        input.targetType,
        input.targetId,
      );

      return {
        emoji: input.emoji,
        toggledOn: false,
        reactionSummary,
        userReactions,
      };
    }

    const created = await ReactionModel.create({
      userId: input.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      emoji: input.emoji,
    });

    const reactionSummary = await adjustTargetSummary(
      input.targetType,
      input.targetId,
      input.emoji,
      1,
    );
    const count = await this.countUserReactions(
      input.userId,
      input.targetType,
      input.targetId,
    );
    if (count > MAX_REACTIONS_PER_USER) {
      await created.deleteOne();
      await adjustTargetSummary(input.targetType, input.targetId, input.emoji, -1);
      throw new AppError("Reaction limit reached", {
        statusCode: 422,
        code: "REACTION_LIMIT_REACHED",
      });
    }

    const userReactions = await this.findUserReactions(
      input.userId,
      input.targetType,
      input.targetId,
    );

    return {
      emoji: input.emoji,
      toggledOn: true,
      reactionSummary,
      userReactions,
    };
  }

  async remove(input: RemoveReactionInput): Promise<ReactionMutationResult> {
    const existing = await ReactionModel.findOneAndDelete({
      userId: input.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      emoji: input.emoji,
    });

    if (!existing) {
      const [reactionSummary, userReactions] = await Promise.all([
        getTargetSummary(input.targetType, input.targetId),
        this.findUserReactions(input.userId, input.targetType, input.targetId),
      ]);

      return {
        emoji: null,
        toggledOn: false,
        reactionSummary,
        userReactions,
      };
    }

    const reactionSummary = await adjustTargetSummary(
      input.targetType,
      input.targetId,
      input.emoji,
      -1,
    );
    const userReactions = await this.findUserReactions(
      input.userId,
      input.targetType,
      input.targetId,
    );

    return {
      emoji: null,
      toggledOn: false,
      reactionSummary,
      userReactions,
    };
  }

  async findUserReactions(
    userId: string,
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<string[]> {
    const reactions = await ReactionModel.find({ userId, targetType, targetId })
      .select("emoji")
      .lean();
    return reactions.map((reaction) => reaction.emoji);
  }

  async countUserReactions(
    userId: string,
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<number> {
    return ReactionModel.countDocuments({ userId, targetType, targetId });
  }

  async getReactionSummary(
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<Record<string, number>> {
    return getTargetSummary(targetType, targetId);
  }
}
