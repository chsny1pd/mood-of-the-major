import type { ReactionType } from "../../../domain/constants/engagementConstants.js";
import type {
  RemoveReactionInput,
  ReactionTargetType,
  UpsertReactionInput,
} from "../../../domain/entities/Reaction.js";
import type {
  IReactionRepository,
  ReactionUpsertResult,
} from "../../../domain/ports/IReactionRepository.js";
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
  reactionType: string,
  delta: number,
): Promise<Record<string, number>> {
  const key = `reactionSummary.${reactionType}`;

  if (targetType === "mood") {
    const updated = await MoodModel.findOneAndUpdate(
      { _id: targetId },
      { $inc: { [key]: delta }, $set: { lastActivityAt: new Date() } },
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
  async upsert(input: UpsertReactionInput): Promise<ReactionUpsertResult> {
    const existing = await ReactionModel.findOne({
      userId: input.userId,
      targetType: input.targetType,
      targetId: input.targetId,
    });

    if (existing) {
      if (existing.reactionType === input.reactionType) {
        return {
          reactionType: input.reactionType,
          reactionSummary: await getTargetSummary(input.targetType, input.targetId),
        };
      }

      const oldType = existing.reactionType;
      existing.reactionType = input.reactionType;
      await existing.save();

      await adjustTargetSummary(input.targetType, input.targetId, oldType, -1);
      const reactionSummary = await adjustTargetSummary(
        input.targetType,
        input.targetId,
        input.reactionType,
        1,
      );

      return { reactionType: input.reactionType, reactionSummary };
    }

    await ReactionModel.create({
      userId: input.userId,
      targetType: input.targetType,
      targetId: input.targetId,
      reactionType: input.reactionType,
    });

    const reactionSummary = await adjustTargetSummary(
      input.targetType,
      input.targetId,
      input.reactionType,
      1,
    );

    return { reactionType: input.reactionType, reactionSummary };
  }

  async remove(input: RemoveReactionInput): Promise<ReactionUpsertResult> {
    const existing = await ReactionModel.findOneAndDelete({
      userId: input.userId,
      targetType: input.targetType,
      targetId: input.targetId,
    });

    if (!existing) {
      return {
        reactionType: null,
        reactionSummary: await getTargetSummary(input.targetType, input.targetId),
      };
    }

    const reactionSummary = await adjustTargetSummary(
      input.targetType,
      input.targetId,
      existing.reactionType,
      -1,
    );

    return { reactionType: null, reactionSummary };
  }

  async findUserReaction(
    userId: string,
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<ReactionType | null> {
    const reaction = await ReactionModel.findOne({ userId, targetType, targetId }).lean();
    return (reaction?.reactionType as ReactionType | undefined) ?? null;
  }

  async getReactionSummary(
    targetType: ReactionTargetType,
    targetId: string,
  ): Promise<Record<string, number>> {
    return getTargetSummary(targetType, targetId);
  }
}
