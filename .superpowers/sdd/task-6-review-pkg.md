BASE 84940413183226936de67ec3ffb567e251d4d732
HEAD 42fd9d644739f1dc8f341226355db15d13383b5d

42fd9d6 feat(reactions): update frontend types and API client for emoji reactions
 frontend/src/components/MoodCard.tsx               |  5 +-
 .../features/reactions/components/ReactionBar.tsx  | 51 +++++++++------------
 frontend/src/services/reactionService.ts           | 53 +++++++++++-----------
 frontend/src/types/engagement.ts                   | 18 +++-----
 4 files changed, 57 insertions(+), 70 deletions(-)
diff --git a/frontend/src/components/MoodCard.tsx b/frontend/src/components/MoodCard.tsx
index 7604433..4317f2c 100644
--- a/frontend/src/components/MoodCard.tsx
+++ b/frontend/src/components/MoodCard.tsx
@@ -6,11 +6,10 @@ import { BookmarkIconButton } from "../features/bookmarks/components/BookmarkIco
 import { RepostButton } from "../features/repost/components/RepostButton";
 import { ROUTES } from "../constants/routes";
 import { useLocalizedName } from "../lib/useLocalizedName";
 import { useRelativeTime } from "../hooks/useRelativeTime";
 import { themeClasses } from "../lib/themeClasses";
-import { REACTION_TYPES } from "../types/engagement";
 import type { AnonymousMood } from "../types/mood";
 
 export const MoodCard = memo(function MoodCard({
   mood,
   showBookmark = false,
@@ -23,12 +22,12 @@ export const MoodCard = memo(function MoodCard({
   const { t } = useTranslation();
   const localizedName = useLocalizedName();
   const relativeTime = useRelativeTime(mood.createdAt);
 
   const primaryTag = mood.tags.find((tag) => tag.isPrimary) ?? mood.tags[0];
-  const totalReactions = REACTION_TYPES.reduce(
-    (sum, reaction) => sum + (mood.reactionSummary[reaction.type] ?? 0),
+  const totalReactions = Object.values(mood.reactionSummary ?? {}).reduce(
+    (sum, n) => sum + (typeof n === "number" ? n : 0),
     0,
   );
 
   return (
     <article className={`p-5 transition hover:border-orange-200 dark:hover:border-orange-800 ${themeClasses.cardLg}`}>
diff --git a/frontend/src/features/reactions/components/ReactionBar.tsx b/frontend/src/features/reactions/components/ReactionBar.tsx
index 15c8390..ab0e1bc 100644
--- a/frontend/src/features/reactions/components/ReactionBar.tsx
+++ b/frontend/src/features/reactions/components/ReactionBar.tsx
@@ -1,15 +1,10 @@
 import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
 import { useTranslation } from "react-i18next";
-import {
-  REACTION_TYPES,
-  getReactionTranslationKey,
-  type ReactionType,
-  type ReactionView,
-} from "../../../types/engagement";
+import { DEFAULT_REACTION_EMOJIS, type ReactionView } from "../../../types/engagement";
 import { queryKeys } from "../../../constants/queryKeys";
-import { fetchReactions, removeReaction, upsertReaction } from "../../../services/reactionService";
+import { fetchReactions, toggleReaction } from "../../../services/reactionService";
 import { useAuth } from "../../../hooks/useAuth";
 import { Link } from "react-router-dom";
 import { ROUTES } from "../../../constants/routes";
 
 interface ReactionBarProps {
@@ -27,34 +22,33 @@ export function ReactionBar({ targetType, targetId, compact = false }: ReactionB
     queryKey: queryKeys.reactions(targetType, targetId),
     queryFn: () => fetchReactions(targetType, targetId),
   });
 
   const mutation = useMutation({
-    mutationFn: async (reactionType: ReactionType | null) => {
-      if (reactionType === null) {
-        return removeReaction(targetType, targetId);
-      }
-      return upsertReaction(targetType, targetId, reactionType);
-    },
-    onMutate: async (nextType) => {
+    mutationFn: (emoji: string) => toggleReaction(targetType, targetId, emoji),
+    onMutate: async (emoji) => {
       await queryClient.cancelQueries({ queryKey: queryKeys.reactions(targetType, targetId) });
       const previous = queryClient.getQueryData<ReactionView>(
         queryKeys.reactions(targetType, targetId),
       );
 
       if (previous) {
         const summary = { ...previous.reactionSummary };
-        if (previous.userReaction) {
-          summary[previous.userReaction] = Math.max(0, (summary[previous.userReaction] ?? 1) - 1);
-        }
-        if (nextType) {
-          summary[nextType] = (summary[nextType] ?? 0) + 1;
+        const hadReaction = previous.userReactions.includes(emoji);
+        const userReactions = hadReaction
+          ? previous.userReactions.filter((e) => e !== emoji)
+          : [...previous.userReactions, emoji];
+
+        if (hadReaction) {
+          summary[emoji] = Math.max(0, (summary[emoji] ?? 1) - 1);
+        } else {
+          summary[emoji] = (summary[emoji] ?? 0) + 1;
         }
 
         queryClient.setQueryData<ReactionView>(queryKeys.reactions(targetType, targetId), {
           ...previous,
-          userReaction: nextType,
+          userReactions,
           reactionSummary: summary,
         });
       }
 
       return { previous };
@@ -74,29 +68,28 @@ export function ReactionBar({ targetType, targetId, compact = false }: ReactionB
   }
 
   const data = reactionsQuery.data;
   if (!data) return null;
 
-  const handleClick = (type: ReactionType) => {
+  const handleClick = (emoji: string) => {
     if (!isAuthenticated) return;
-    const next = data.userReaction === type ? null : type;
-    mutation.mutate(next);
+    mutation.mutate(emoji);
   };
 
   return (
     <div className={`flex flex-wrap gap-2 ${compact ? "text-xs" : "text-sm"}`}>
-      {REACTION_TYPES.map((reaction) => {
-        const count = data.reactionSummary[reaction.type] ?? 0;
-        const isActive = data.userReaction === reaction.type;
-        const label = t(getReactionTranslationKey(reaction.type));
+      {DEFAULT_REACTION_EMOJIS.map((reaction) => {
+        const count = data.reactionSummary[reaction.emoji] ?? 0;
+        const isActive = data.userReactions.includes(reaction.emoji);
+        const label = t(reaction.translationKey);
 
         return (
           <button
-            key={reaction.type}
+            key={reaction.emoji}
             type="button"
             disabled={!isAuthenticated || mutation.isPending}
-            onClick={() => handleClick(reaction.type)}
+            onClick={() => handleClick(reaction.emoji)}
             className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition ${
               isActive
                 ? "border-orange-600 bg-orange-50 text-orange-900"
                 : "border-stone-200 bg-white text-stone-600 hover:border-orange-300"
             } disabled:cursor-not-allowed disabled:opacity-60`}
diff --git a/frontend/src/services/reactionService.ts b/frontend/src/services/reactionService.ts
index 05a1753..7d1e665 100644
--- a/frontend/src/services/reactionService.ts
+++ b/frontend/src/services/reactionService.ts
@@ -1,47 +1,48 @@
 import { apiClient } from "./apiClient";
-import type { ReactionType, ReactionView } from "../types/engagement";
+import type { ReactionView } from "../types/engagement";
+
+function normalizeReactionView(
+  data: Pick<ReactionView, "targetType" | "targetId" | "reactionSummary"> &
+    Partial<Pick<ReactionView, "userReactions">>,
+): ReactionView {
+  return {
+    targetType: data.targetType,
+    targetId: data.targetId,
+    reactionSummary: data.reactionSummary,
+    userReactions: data.userReactions ?? [],
+  };
+}
 
 export async function fetchReactions(
   targetType: "mood" | "comment",
   targetId: string,
 ): Promise<ReactionView> {
   const response = await apiClient.get<{ success: true; data: ReactionView }>("/reactions", {
     params: { targetType, targetId },
   });
-  return response.data.data;
+  return normalizeReactionView(response.data.data);
 }
 
-export async function upsertReaction(
+export async function toggleReaction(
   targetType: "mood" | "comment",
   targetId: string,
-  reactionType: ReactionType,
+  emoji: string,
 ): Promise<ReactionView> {
-  const response = await apiClient.put<{ success: true; data: ReactionView & { reactionType: ReactionType } }>(
-    "/reactions",
-    { targetType, targetId, reactionType },
-  );
-
-  return {
-    targetType: response.data.data.targetType,
-    targetId: response.data.data.targetId,
-    reactionSummary: response.data.data.reactionSummary,
-    userReaction: response.data.data.reactionType,
-  };
+  const response = await apiClient.put<{ success: true; data: ReactionView }>("/reactions", {
+    targetType,
+    targetId,
+    emoji,
+  });
+  return normalizeReactionView(response.data.data);
 }
 
 export async function removeReaction(
   targetType: "mood" | "comment",
   targetId: string,
+  emoji: string,
 ): Promise<ReactionView> {
-  const response = await apiClient.delete<{ success: true; data: { reactionSummary: Record<string, number> } }>(
-    "/reactions",
-    { data: { targetType, targetId } },
-  );
-
-  return {
-    targetType,
-    targetId,
-    reactionSummary: response.data.data.reactionSummary,
-    userReaction: null,
-  };
+  const response = await apiClient.delete<{ success: true; data: ReactionView }>("/reactions", {
+    data: { targetType, targetId, emoji },
+  });
+  return normalizeReactionView(response.data.data);
 }
diff --git a/frontend/src/types/engagement.ts b/frontend/src/types/engagement.ts
index 0eadbe5..6de9e01 100644
--- a/frontend/src/types/engagement.ts
+++ b/frontend/src/types/engagement.ts
@@ -1,28 +1,22 @@
-export const REACTION_TYPES = [
-  { type: "empathy", emoji: "=ƒÆÖ" },
-  { type: "support", emoji: "=ƒñ¥" },
-  { type: "relate", emoji: "=ƒ½é" },
-  { type: "solidarity", emoji: "G£è" },
+export const DEFAULT_REACTION_EMOJIS = [
+  { emoji: "=ƒÆÖ", translationKey: "engagement.reactions.empathy" },
+  { emoji: "=ƒñ¥", translationKey: "engagement.reactions.support" },
+  { emoji: "=ƒ½é", translationKey: "engagement.reactions.relate" },
+  { emoji: "G£è", translationKey: "engagement.reactions.solidarity" },
 ] as const;
 
-export type ReactionType = (typeof REACTION_TYPES)[number]["type"];
-
 export const REPORT_REASONS = [
   { code: "harassment" },
   { code: "spam" },
   { code: "self_harm" },
   { code: "hate_speech" },
   { code: "other" },
 ] as const;
 
 export type ReportReasonCode = (typeof REPORT_REASONS)[number]["code"];
 
-export function getReactionTranslationKey(type: ReactionType): string {
-  return `engagement.reactions.${type}`;
-}
-
 export function getReportReasonTranslationKey(code: ReportReasonCode): string {
   return `engagement.reportReasons.${code}`;
 }
 
 export interface AnonymousComment {
@@ -46,7 +40,7 @@ export interface PaginatedComments {
 
 export interface ReactionView {
   targetType: "mood" | "comment";
   targetId: string;
   reactionSummary: Record<string, number>;
-  userReaction: ReactionType | null;
+  userReactions: string[];
 }
