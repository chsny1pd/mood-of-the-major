BASE 008c90280460f992a1cccd70d9a8d691a2812eb6
HEAD 9ff29071ba4991acba53df388075b0db42269008

9ff2907 feat(reactions): persist multi-emoji reactions in mongoose
 .../src/infrastructure/database/models/Reaction.ts |   9 +-
 .../repositories/MongooseReactionRepository.ts     | 107 ++++++++++++++-------
 2 files changed, 77 insertions(+), 39 deletions(-)
diff --git a/backend/src/infrastructure/database/models/Reaction.ts b/backend/src/infrastructure/database/models/Reaction.ts
index 64c0c5f..90a617b 100644
--- a/backend/src/infrastructure/database/models/Reaction.ts
+++ b/backend/src/infrastructure/database/models/Reaction.ts
@@ -1,22 +1,25 @@
 import { Schema, model, type InferSchemaType, type Types } from "mongoose";
-import { REACTION_TYPES } from "../../../domain/constants/engagementConstants.js";
 
 const reactionSchema = new Schema(
   {
     userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
     targetType: { type: String, required: true, enum: ["mood", "comment"] },
     targetId: { type: Schema.Types.ObjectId, required: true },
-    reactionType: { type: String, required: true, enum: REACTION_TYPES },
+    emoji: { type: String, required: true, maxlength: 8 },
   },
   { timestamps: true, collection: "reactions" },
 );
 
-reactionSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
+reactionSchema.index(
+  { userId: 1, targetType: 1, targetId: 1, emoji: 1 },
+  { unique: true },
+);
 reactionSchema.index({ targetType: 1, targetId: 1 });
+reactionSchema.index({ userId: 1, targetType: 1, targetId: 1 });
 
 export type ReactionDocument = InferSchemaType<typeof reactionSchema> & {
   userId: Types.ObjectId;
   targetId: Types.ObjectId;
 };
 
 export const ReactionModel = model("Reaction", reactionSchema);
diff --git a/backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts b/backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts
index 0b0a31a..55763b1 100644
--- a/backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts
+++ b/backend/src/infrastructure/database/repositories/MongooseReactionRepository.ts
@@ -1,141 +1,176 @@
-import type { ReactionType } from "../../../domain/constants/engagementConstants.js";
 import type {
+  ReactionMutationResult,
   RemoveReactionInput,
   ReactionTargetType,
-  UpsertReactionInput,
+  ToggleReactionInput,
 } from "../../../domain/entities/Reaction.js";
-import type {
-  IReactionRepository,
-  ReactionUpsertResult,
-} from "../../../domain/ports/IReactionRepository.js";
+import type { IReactionRepository } from "../../../domain/ports/IReactionRepository.js";
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
-  reactionType: string,
+  emoji: string,
   delta: number,
 ): Promise<Record<string, number>> {
-  const key = `reactionSummary.${reactionType}`;
+  const key = `reactionSummary.${emoji}`;
 
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
-  async upsert(input: UpsertReactionInput): Promise<ReactionUpsertResult> {
+  async toggle(input: ToggleReactionInput): Promise<ReactionMutationResult> {
     const existing = await ReactionModel.findOne({
       userId: input.userId,
       targetType: input.targetType,
       targetId: input.targetId,
+      emoji: input.emoji,
     });
 
     if (existing) {
-      if (existing.reactionType === input.reactionType) {
-        return {
-          reactionType: input.reactionType,
-          reactionSummary: await getTargetSummary(input.targetType, input.targetId),
-        };
-      }
-
-      const oldType = existing.reactionType;
-      existing.reactionType = input.reactionType;
-      await existing.save();
-
-      await adjustTargetSummary(input.targetType, input.targetId, oldType, -1);
+      await existing.deleteOne();
       const reactionSummary = await adjustTargetSummary(
         input.targetType,
         input.targetId,
-        input.reactionType,
-        1,
+        input.emoji,
+        -1,
+      );
+      const userReactions = await this.findUserReactions(
+        input.userId,
+        input.targetType,
+        input.targetId,
       );
 
-      return { reactionType: input.reactionType, reactionSummary };
+      return {
+        emoji: input.emoji,
+        toggledOn: false,
+        reactionSummary,
+        userReactions,
+      };
     }
 
     await ReactionModel.create({
       userId: input.userId,
       targetType: input.targetType,
       targetId: input.targetId,
-      reactionType: input.reactionType,
+      emoji: input.emoji,
     });
 
     const reactionSummary = await adjustTargetSummary(
       input.targetType,
       input.targetId,
-      input.reactionType,
+      input.emoji,
       1,
     );
+    const userReactions = await this.findUserReactions(
+      input.userId,
+      input.targetType,
+      input.targetId,
+    );
 
-    return { reactionType: input.reactionType, reactionSummary };
+    return {
+      emoji: input.emoji,
+      toggledOn: true,
+      reactionSummary,
+      userReactions,
+    };
   }
 
-  async remove(input: RemoveReactionInput): Promise<ReactionUpsertResult> {
+  async remove(input: RemoveReactionInput): Promise<ReactionMutationResult> {
     const existing = await ReactionModel.findOneAndDelete({
       userId: input.userId,
       targetType: input.targetType,
       targetId: input.targetId,
+      emoji: input.emoji,
     });
 
     if (!existing) {
+      const [reactionSummary, userReactions] = await Promise.all([
+        getTargetSummary(input.targetType, input.targetId),
+        this.findUserReactions(input.userId, input.targetType, input.targetId),
+      ]);
+
       return {
-        reactionType: null,
-        reactionSummary: await getTargetSummary(input.targetType, input.targetId),
+        emoji: null,
+        toggledOn: false,
+        reactionSummary,
+        userReactions,
       };
     }
 
     const reactionSummary = await adjustTargetSummary(
       input.targetType,
       input.targetId,
-      existing.reactionType,
+      input.emoji,
       -1,
     );
+    const userReactions = await this.findUserReactions(
+      input.userId,
+      input.targetType,
+      input.targetId,
+    );
 
-    return { reactionType: null, reactionSummary };
+    return {
+      emoji: null,
+      toggledOn: false,
+      reactionSummary,
+      userReactions,
+    };
+  }
+
+  async findUserReactions(
+    userId: string,
+    targetType: ReactionTargetType,
+    targetId: string,
+  ): Promise<string[]> {
+    const reactions = await ReactionModel.find({ userId, targetType, targetId })
+      .select("emoji")
+      .lean();
+    return reactions.map((reaction) => reaction.emoji);
   }
 
-  async findUserReaction(
+  async countUserReactions(
     userId: string,
     targetType: ReactionTargetType,
     targetId: string,
-  ): Promise<ReactionType | null> {
-    const reaction = await ReactionModel.findOne({ userId, targetType, targetId }).lean();
-    return (reaction?.reactionType as ReactionType | undefined) ?? null;
+  ): Promise<number> {
+    return ReactionModel.countDocuments({ userId, targetType, targetId });
   }
 
   async getReactionSummary(
     targetType: ReactionTargetType,
     targetId: string,
   ): Promise<Record<string, number>> {
     return getTargetSummary(targetType, targetId);
   }
 }
