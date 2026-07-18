import { memo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EmotionBadge } from "./EmotionBadge";
import { BookmarkIconButton } from "../features/bookmarks/components/BookmarkIconButton";
import { RepostButton } from "../features/repost/components/RepostButton";
import { ROUTES } from "../constants/routes";
import { useLocalizedName } from "../lib/useLocalizedName";
import { useRelativeTime } from "../hooks/useRelativeTime";
import { themeClasses } from "../lib/themeClasses";
import type { AnonymousMood } from "../types/mood";

export const MoodCard = memo(function MoodCard({
  mood,
  showBookmark = false,
  showRepost = false,
}: {
  mood: AnonymousMood;
  showBookmark?: boolean;
  showRepost?: boolean;
}) {
  const { t } = useTranslation();
  const localizedName = useLocalizedName();
  const relativeTime = useRelativeTime(mood.createdAt);

  const primaryTag = mood.tags.find((tag) => tag.isPrimary) ?? mood.tags[0];
  const totalReactions = Object.values(mood.reactionSummary ?? {}).reduce(
    (sum, n) => sum + (typeof n === "number" ? n : 0),
    0,
  );

  return (
    <article className={`p-5 transition hover:border-orange-200 dark:hover:border-orange-800 ${themeClasses.cardLg}`}>
      {mood.isRepost && mood.repostOf ? (
        <p className={`mb-2 text-xs ${themeClasses.muted}`}>
          {t("repost.repostedFrom")}{" "}
          <Link to={ROUTES.moodDetail(mood.repostOf.moodId)} className={themeClasses.linkSubtle}>
            {mood.repostOf.excerpt}
          </Link>
        </p>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {primaryTag ? (
          <EmotionBadge
            name={localizedName(primaryTag)}
            slug={primaryTag.slug}
            iconKey={primaryTag.iconKey}
            isPrimary
          />
        ) : null}
        {mood.faculty ? (
          <Link
            to={ROUTES.facultyFeed(mood.faculty.slug)}
            className={`text-xs ${themeClasses.linkSubtle}`}
            onClick={(event) => event.stopPropagation()}
          >
            {localizedName(mood.faculty)}
          </Link>
        ) : null}
        {mood.major ? (
          <Link
            to={ROUTES.majorFeed(mood.major.slug)}
            className={`text-xs ${themeClasses.linkSubtle}`}
            onClick={(event) => event.stopPropagation()}
          >
            {localizedName(mood.major)}
          </Link>
        ) : null}
        <span className="ml-auto flex items-center gap-1">
          {showBookmark ? <BookmarkIconButton moodId={mood.id} /> : null}
          <span className={`text-xs ${themeClasses.faint}`}>{relativeTime}</span>
        </span>
      </div>

      <Link to={ROUTES.moodDetail(mood.id)} className="block">
        <p className={`whitespace-pre-wrap line-clamp-4 ${themeClasses.subheading}`}>{mood.content}</p>
      </Link>

      <div className={`mt-4 flex flex-wrap items-center gap-4 text-xs ${themeClasses.muted}`}>
        {mood.imageCount > 0 ? (
          <span>{t("moodCard.image", { count: mood.imageCount })}</span>
        ) : null}
        <span>{t("moodCard.comments", { count: mood.commentCount })}</span>
        {totalReactions > 0 ? (
          <span>{t("moodCard.reactions", { count: totalReactions })}</span>
        ) : null}
        {(mood.repostCount ?? 0) > 0 ? (
          <span>{t("moodCard.reposts", { count: mood.repostCount })}</span>
        ) : null}
        {showRepost ? (
          <RepostButton
            moodId={mood.id}
            hasReposted={mood.hasReposted}
            isRepost={mood.isRepost}
            repostCount={mood.repostCount}
            compact
          />
        ) : null}
      </div>
    </article>
  );
});
