import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  REACTION_TYPES,
  getReactionTranslationKey,
  type ReactionType,
  type ReactionView,
} from "../../../types/engagement";
import { queryKeys } from "../../../constants/queryKeys";
import { fetchReactions, removeReaction, upsertReaction } from "../../../services/reactionService";
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
    mutationFn: async (reactionType: ReactionType | null) => {
      if (reactionType === null) {
        return removeReaction(targetType, targetId);
      }
      return upsertReaction(targetType, targetId, reactionType);
    },
    onMutate: async (nextType) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.reactions(targetType, targetId) });
      const previous = queryClient.getQueryData<ReactionView>(
        queryKeys.reactions(targetType, targetId),
      );

      if (previous) {
        const summary = { ...previous.reactionSummary };
        if (previous.userReaction) {
          summary[previous.userReaction] = Math.max(0, (summary[previous.userReaction] ?? 1) - 1);
        }
        if (nextType) {
          summary[nextType] = (summary[nextType] ?? 0) + 1;
        }

        queryClient.setQueryData<ReactionView>(queryKeys.reactions(targetType, targetId), {
          ...previous,
          userReaction: nextType,
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

  const handleClick = (type: ReactionType) => {
    if (!isAuthenticated) return;
    const next = data.userReaction === type ? null : type;
    mutation.mutate(next);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "text-xs" : "text-sm"}`}>
      {REACTION_TYPES.map((reaction) => {
        const count = data.reactionSummary[reaction.type] ?? 0;
        const isActive = data.userReaction === reaction.type;
        const label = t(getReactionTranslationKey(reaction.type));

        return (
          <button
            key={reaction.type}
            type="button"
            disabled={!isAuthenticated || mutation.isPending}
            onClick={() => handleClick(reaction.type)}
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
