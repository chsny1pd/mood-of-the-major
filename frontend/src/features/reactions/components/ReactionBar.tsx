import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { DEFAULT_REACTION_EMOJIS, type ReactionView } from "../../../types/engagement";
import { queryKeys } from "../../../constants/queryKeys";
import { fetchReactions, toggleReaction } from "../../../services/reactionService";
import { useAuth } from "../../../hooks/useAuth";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import { themeClasses } from "../../../lib/themeClasses";
import { ReactionEmojiPicker } from "./ReactionEmojiPicker";

const MAX_USER_REACTIONS = 7;

interface ReactionBarProps {
  targetType: "mood" | "comment";
  targetId: string;
  compact?: boolean;
}

export function ReactionBar({ targetType, targetId, compact = false }: ReactionBarProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const reactionsQuery = useQuery({
    queryKey: queryKeys.reactions(targetType, targetId),
    queryFn: () => fetchReactions(targetType, targetId),
  });

  const mutation = useMutation({
    mutationFn: (emoji: string) => toggleReaction(targetType, targetId, emoji),
    onMutate: async (emoji) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.reactions(targetType, targetId) });
      const previous = queryClient.getQueryData<ReactionView>(
        queryKeys.reactions(targetType, targetId),
      );

      if (previous) {
        const summary = { ...previous.reactionSummary };
        const hadReaction = previous.userReactions.includes(emoji);
        const userReactions = hadReaction
          ? previous.userReactions.filter((e) => e !== emoji)
          : [...previous.userReactions, emoji];

        if (hadReaction) {
          summary[emoji] = Math.max(0, (summary[emoji] ?? 1) - 1);
        } else {
          summary[emoji] = (summary[emoji] ?? 0) + 1;
        }

        queryClient.setQueryData<ReactionView>(queryKeys.reactions(targetType, targetId), {
          ...previous,
          userReactions,
          reactionSummary: summary,
        });
      }

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.reactions(targetType, targetId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reactions(targetType, targetId) });
    },
  });

  if (reactionsQuery.isLoading) {
    return <div className="h-8 animate-pulse rounded-lg bg-stone-100" />;
  }

  const data = reactionsQuery.data;
  if (!data) return null;

  const handleClick = (emoji: string) => {
    if (!isAuthenticated) return;
    const isOwned = data.userReactions.includes(emoji);
    if (!isOwned && data.userReactions.length >= MAX_USER_REACTIONS) return;
    mutation.mutate(emoji);
  };

  const extraEmojis = Object.keys(data.reactionSummary).filter(
    (emoji) =>
      !DEFAULT_REACTION_EMOJIS.some((reaction) => reaction.emoji === emoji) &&
      (data.reactionSummary[emoji] ?? 0) > 0,
  );
  const reactions = [
    ...DEFAULT_REACTION_EMOJIS.map((reaction) => ({
      emoji: reaction.emoji,
      label: t(reaction.translationKey),
    })),
    ...extraEmojis.map((emoji) => ({ emoji, label: emoji })),
  ];
  const isAtLimit = data.userReactions.length >= MAX_USER_REACTIONS;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
      {reactions.map((reaction) => {
        const count = data.reactionSummary[reaction.emoji] ?? 0;
        const isActive = data.userReactions.includes(reaction.emoji);
        const cannotAdd = isAtLimit && !isActive;

        return (
          <button
            key={reaction.emoji}
            type="button"
            disabled={!isAuthenticated || mutation.isPending || cannotAdd}
            onClick={() => handleClick(reaction.emoji)}
            className={`inline-flex h-8 items-center gap-1 rounded-full border px-2.5 transition ${
              isActive
                ? "border-orange-600 bg-orange-50 text-orange-900 dark:border-orange-500 dark:bg-orange-950 dark:text-orange-100"
                : "border-stone-200 bg-white text-stone-600 hover:border-orange-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-orange-700"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            title={cannotAdd ? t("engagement.reactionLimit") : reaction.label}
            aria-pressed={isActive}
          >
            <span>{reaction.emoji}</span>
            {count > 0 ? <span>{count}</span> : null}
          </button>
        );
      })}
      <ReactionEmojiPicker
        disabled={!isAuthenticated || mutation.isPending || isAtLimit}
        onPick={handleClick}
      />
      {isAuthenticated && isAtLimit ? (
        <span className={`text-xs ${themeClasses.muted}`}>{t("engagement.reactionLimit")}</span>
      ) : null}
      {!isAuthenticated ? (
        <Link to={ROUTES.login} className={`self-center text-xs ${themeClasses.linkSubtle}`}>
          {t("engagement.logInToReact")}
        </Link>
      ) : null}
    </div>
  );
}
