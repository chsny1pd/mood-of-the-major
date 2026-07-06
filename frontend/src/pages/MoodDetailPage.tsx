import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { EmotionBadge } from "../components/EmotionBadge";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { queryKeys } from "../constants/queryKeys";
import { ROUTES } from "../constants/routes";
import { CommentSection } from "../features/comments/components/CommentSection";
import { BookmarkButton } from "../features/bookmarks/components/BookmarkButton";
import { ReactionBar } from "../features/reactions/components/ReactionBar";
import { ReportModal } from "../features/report/components/ReportModal";
import { fetchSignedImageUrl } from "../services/imageService";
import { fetchMoodById } from "../services/moodService";
import { useAuth } from "../contexts/AuthContext";

function MoodImage({ imageId }: { imageId: string }) {
  const imageQuery = useQuery({
    queryKey: queryKeys.imageUrl(imageId),
    queryFn: () => fetchSignedImageUrl(imageId),
    staleTime: 30 * 60 * 1000,
  });

  if (imageQuery.isLoading) return <Skeleton className="h-48 w-full" />;
  if (imageQuery.isError || !imageQuery.data) return null;

  return (
    <img
      src={imageQuery.data}
      alt=""
      className="h-48 w-full rounded-xl object-cover"
      loading="lazy"
    />
  );
}

export function MoodDetailPage() {
  const { moodId = "" } = useParams();
  const { isAuthenticated } = useAuth();
  const [showReport, setShowReport] = useState(false);

  const moodQuery = useQuery({
    queryKey: queryKeys.moodDetail(moodId),
    queryFn: () => fetchMoodById(moodId),
    enabled: Boolean(moodId),
  });

  if (moodQuery.isLoading) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </section>
    );
  }

  if (moodQuery.isError || !moodQuery.data) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <EmptyState
          title="Mood not found"
          description="This post may have been removed or does not exist."
          action={
            <Link to={ROUTES.feed} className="text-sm font-medium text-teal-800 hover:underline">
              Back to feed
            </Link>
          }
        />
      </section>
    );
  }

  const mood = moodQuery.data;

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link to={ROUTES.feed} className="text-sm text-teal-800 hover:underline">
        ← Back to feed
      </Link>

      <article className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2">
          {mood.tags.map((tag) => (
            <EmotionBadge key={tag.id} name={tag.name} isPrimary={tag.isPrimary} />
          ))}
        </div>

        <p className="whitespace-pre-wrap text-lg text-stone-800">{mood.content}</p>

        {mood.images.length > 0 ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {mood.images.map((image) => (
              <MoodImage key={image.id} imageId={image.id} />
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3 text-sm text-stone-500">
          {mood.faculty ? <span>{mood.faculty.name}</span> : null}
          {mood.major ? <span>{mood.major.name}</span> : null}
          <span>{new Date(mood.createdAt).toLocaleString()}</span>
        </div>

        <div className="mt-6 border-t border-stone-100 pt-4">
          <ReactionBar targetType="mood" targetId={mood.id} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <BookmarkButton moodId={mood.id} />
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="text-sm text-stone-500 hover:text-red-700"
            >
              Report
            </button>
          ) : null}
        </div>
      </article>

      <CommentSection moodId={mood.id} />

      {showReport ? (
        <ReportModal targetType="mood" targetId={mood.id} onClose={() => setShowReport(false)} />
      ) : null}
    </section>
  );
}
