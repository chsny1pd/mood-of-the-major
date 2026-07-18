diff --git a/backend/src/domain/entities/Reaction.ts b/backend/src/domain/entities/Reaction.ts
index 0a62668..2861cb2 100644
--- a/backend/src/domain/entities/Reaction.ts
+++ b/backend/src/domain/entities/Reaction.ts
@@ -1,26 +1,32 @@
-import type { ReactionType } from "../constants/engagementConstants.js";
-
 export type ReactionTargetType = "mood" | "comment";
 
 export interface Reaction {
   id: string;
   userId: string;
   targetType: ReactionTargetType;
   targetId: string;
-  reactionType: ReactionType;
+  emoji: string;
   createdAt: Date;
   updatedAt: Date;
 }
 
-export interface UpsertReactionInput {
+export interface ToggleReactionInput {
   userId: string;
   targetType: ReactionTargetType;
   targetId: string;
-  reactionType: ReactionType;
+  emoji: string;
 }
 
 export interface RemoveReactionInput {
   userId: string;
   targetType: ReactionTargetType;
   targetId: string;
+  emoji: string;
+}
+
+export interface ReactionMutationResult {
+  emoji: string | null;
+  toggledOn: boolean;
+  reactionSummary: Record<string, number>;
+  userReactions: string[];
 }
diff --git a/backend/src/domain/ports/IReactionRepository.ts b/backend/src/domain/ports/IReactionRepository.ts
index 54e6dd9..a19f6ad 100644
--- a/backend/src/domain/ports/IReactionRepository.ts
+++ b/backend/src/domain/ports/IReactionRepository.ts
@@ -1,28 +1,28 @@
 import type {
   Reaction,
+  ReactionMutationResult,
   RemoveReactionInput,
   ReactionTargetType,
-  UpsertReactionInput,
+  ToggleReactionInput,
 } from "../entities/Reaction.js";
-import type { ReactionType } from "../constants/engagementConstants.js";
-
-export interface ReactionUpsertResult {
-  reactionType: ReactionType | null;
-  reactionSummary: Record<string, number>;
-}
 
 export interface IReactionRepository {
-  upsert(input: UpsertReactionInput): Promise<ReactionUpsertResult>;
-  remove(input: RemoveReactionInput): Promise<ReactionUpsertResult>;
-  findUserReaction(
+  toggle(input: ToggleReactionInput): Promise<ReactionMutationResult>;
+  remove(input: RemoveReactionInput): Promise<ReactionMutationResult>;
+  findUserReactions(
+    userId: string,
+    targetType: ReactionTargetType,
+    targetId: string,
+  ): Promise<string[]>;
+  countUserReactions(
     userId: string,
     targetType: ReactionTargetType,
     targetId: string,
-  ): Promise<ReactionType | null>;
+  ): Promise<number>;
   getReactionSummary(
     targetType: ReactionTargetType,
     targetId: string,
   ): Promise<Record<string, number>>;
 }
 
 export type { Reaction };
