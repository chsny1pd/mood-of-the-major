import { memo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EmotionBadge } from "./EmotionBadge";
import { BookmarkIconButton } from "../features/bookmarks/components/BookmarkIconButton";
import { ROUTES } from "../constants/routes";
import { useLocalizedName } from "../lib/useLocalizedName";
import { REACTION_TYPES } from "../types/engagement";
import type { AnonymousMood } from "../types/mood";

function useRelativeTime(isoDate: string): string {
  const { t } = useTranslation();
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return t("time.justNow");
  if (diffMinutes < 60) return t("time.minutesAgo", { count: diffMinutes });

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return t("time.hoursAgo", { count: diffHours });

  const diffDays = Math.floor(diffHours / 24);
  return t("time.daysAgo", { count: diffDays });
}

export const MoodCard = memo(function MoodCard({
  mood,
  showBookmark = false,
}: {
  mood: AnonymousMood;
  showBookmark?: boolean;
}) {
  const { t } = useTranslation();
  const localizedName = useLocalizedName();
  const relativeTime = useRelativeTime(mood.createdAt);

  const primaryTag = mood.tags.find((tag) => tag.isPrimary) ?? mood.tags[0];
  const totalReactions = REACTION_TYPES.reduce(
    (sum, reaction) => sum + (mood.reactionSummary[reaction.type] ?? 0),
    0,
  );

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-teal-200">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {primaryTag ? (
          <EmotionBadge name={localizedName(primaryTag)} isPrimary />
        ) : null}
        {mood.faculty ? (
          <Link
            to={ROUTES.facultyFeed(mood.faculty.slug)}
            className="text-xs text-teal-700 hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {localizedName(mood.faculty)}
          </Link>
        ) : null}
        {mood.major ? (
          <Link
            to={ROUTES.majorFeed(mood.major.slug)}
            className="text-xs text-teal-700 hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {localizedName(mood.major)}
          </Link>
        ) : null}
        <span className="ml-auto flex items-center gap-1">
          {showBookmark ? <BookmarkIconButton moodId={mood.id} /> : null}
          <span className="text-xs text-stone-400">{relativeTime}</span>
        </span>
      </div>

      <Link to={ROUTES.moodDetail(mood.id)} className="block">
        <p className="whitespace-pre-wrap text-stone-800 line-clamp-4">{mood.content}</p>
      </Link>

      <div className="mt-4 flex items-center gap-4 text-xs text-stone-500">
        {mood.imageCount > 0 ? (
          <span>{t("moodCard.image", { count: mood.imageCount })}</span>
        ) : null}
        <span>{t("moodCard.comments", { count: mood.commentCount })}</span>
        {totalReactions > 0 ? (
          <span>{t("moodCard.reactions", { count: totalReactions })}</span>
        ) : null}
      </div>
    </article>
  );
});
