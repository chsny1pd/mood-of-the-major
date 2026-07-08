import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { queryKeys } from "../../../constants/queryKeys";
import { ROUTES } from "../../../constants/routes";
import { repostMood } from "../../../services/moodService";
import { getApiErrorMessage } from "../../../services/apiClient";
import { useAuth } from "../../../hooks/useAuth";

interface RepostButtonProps {
  moodId: string;
  hasReposted?: boolean;
  isRepost?: boolean;
  repostCount?: number;
  compact?: boolean;
}

export function RepostButton({
  moodId,
  hasReposted = false,
  isRepost = false,
  repostCount = 0,
  compact = false,
}: RepostButtonProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => repostMood(moodId),
    onSuccess: (repost) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.moodDetail(moodId) });
      void queryClient.invalidateQueries({ queryKey: ["moods"] });
      navigate(ROUTES.moodDetail(repost.id));
    },
  });

  if (isRepost) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Link to={ROUTES.login} className="text-sm text-stone-500 hover:text-teal-800 dark:hover:text-teal-300">
        {t("repost.logInToRepost")}
      </Link>
    );
  }

  const errorMessage = mutation.isError
    ? getApiErrorMessage(mutation.error, t("repost.error"))
    : null;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || hasReposted}
        className={`rounded-full border px-3 py-1 text-sm transition disabled:opacity-60 ${
          hasReposted
            ? "border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-100"
            : "border-stone-300 text-stone-600 hover:border-teal-400 dark:border-stone-600 dark:text-stone-400 dark:hover:border-teal-500"
        } ${compact ? "px-2 py-0.5 text-xs" : ""}`}
      >
        {mutation.isPending
          ? t("repost.reposting")
          : hasReposted
            ? t("repost.reposted")
            : repostCount > 0
              ? t("repost.repostWithCount", { count: repostCount })
              : t("repost.repost")}
      </button>
      {errorMessage ? <span className="text-xs text-red-600 dark:text-red-400">{errorMessage}</span> : null}
    </div>
  );
}
