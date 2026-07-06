import { Link } from "react-router-dom";
import { EmotionBadge } from "./EmotionBadge";
import { ROUTES } from "../constants/routes";
import { REACTION_TYPES } from "../types/engagement";
import type { AnonymousMood } from "../types/mood";

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function MoodCard({ mood }: { mood: AnonymousMood }) {
  const primaryTag = mood.tags.find((tag) => tag.isPrimary) ?? mood.tags[0];
  const totalReactions = REACTION_TYPES.reduce(
    (sum, reaction) => sum + (mood.reactionSummary[reaction.type] ?? 0),
    0,
  );

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-teal-200">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {primaryTag ? <EmotionBadge name={primaryTag.name} isPrimary /> : null}
        {mood.faculty ? (
          <Link
            to={ROUTES.facultyFeed(mood.faculty.slug)}
            className="text-xs text-teal-700 hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {mood.faculty.name}
          </Link>
        ) : null}
        {mood.major ? (
          <Link
            to={ROUTES.majorFeed(mood.major.slug)}
            className="text-xs text-teal-700 hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {mood.major.name}
          </Link>
        ) : null}
        <span className="ml-auto text-xs text-stone-400">{formatRelativeTime(mood.createdAt)}</span>
      </div>

      <Link to={ROUTES.moodDetail(mood.id)} className="block">
        <p className="whitespace-pre-wrap text-stone-800 line-clamp-4">{mood.content}</p>
      </Link>

      <div className="mt-4 flex items-center gap-4 text-xs text-stone-500">
        {mood.imageCount > 0 ? <span>{mood.imageCount} image{mood.imageCount > 1 ? "s" : ""}</span> : null}
        <span>{mood.commentCount} comments</span>
        {totalReactions > 0 ? <span>{totalReactions} reactions</span> : null}
      </div>
    </article>
  );
}
