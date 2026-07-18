import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { DEFAULT_REACTION_EMOJIS, type ReactionView } from "../../../types/engagement";
import { queryKeys } from "../../../constants/queryKeys";
import { fetchReactions, toggleReaction } from "../../../services/reactionService";
import { useAuth } from "../../../hooks/useAuth";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";

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
    mutation.mutate(emoji);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "text-xs" : "text-sm"}`}>
      {DEFAULT_REACTION_EMOJIS.map((reaction) => {
        const count = data.reactionSummary[reaction.emoji] ?? 0;
        const isActive = data.userReactions.includes(reaction.emoji);
        const label = t(reaction.translationKey);

        return (
          <button
            key={reaction.emoji}
            type="button"
            disabled={!isAuthenticated || mutation.isPending}
            onClick={() => handleClick(reaction.emoji)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 transition ${
              isActive
                ? "border-orange-600 bg-orange-50 text-orange-900"
                : "border-stone-200 bg-white text-stone-600 hover:border-orange-300"
            } disabled:cursor-not-allowed disabled:opacity-60`}
            title={label}
          >
            <span>{reaction.emoji}</span>
            {count > 0 ? <span>{count}</span> : null}
          </button>
        );
      })}
      {!isAuthenticated ? (
        <Link to={ROUTES.login} className="self-center text-xs text-stone-500 hover:text-orange-800">
          {t("engagement.logInToReact")}
        </Link>
      ) : null}
    </div>
  );
}
