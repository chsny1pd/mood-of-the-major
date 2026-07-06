import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { EmotionBadge } from "../components/EmotionBadge";
import { EmptyState } from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import { queryKeys } from "../constants/queryKeys";
import { ROUTES } from "../constants/routes";
import { CommentSection } from "../features/comments/components/CommentSection";
import { BookmarkButton } from "../features/bookmarks/components/BookmarkButton";
import { EditMoodForm } from "../features/mood/components/EditMoodForm";
import { ReactionBar } from "../features/reactions/components/ReactionBar";
import { ReportModal } from "../features/report/components/ReportModal";
import { fetchSignedImageUrl } from "../services/imageService";
import { deleteMood, fetchMoodById } from "../services/moodService";
import { getApiErrorMessage } from "../services/apiClient";
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
      width={800}
      height={192}
      decoding="async"
      className="h-48 w-full rounded-xl object-cover"
      loading="lazy"
    />
  );
}

export function MoodDetailPage() {
  const { moodId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [showReport, setShowReport] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const moodQuery = useQuery({
    queryKey: queryKeys.moodDetail(moodId),
    queryFn: () => fetchMoodById(moodId),
    enabled: Boolean(moodId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMood(moodId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["moods", "feed"] });
      navigate(ROUTES.feed, { replace: true });
    },
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

  const handleDelete = () => {
    if (!window.confirm("Delete this mood? This cannot be undone.")) {
      return;
    }

    void deleteMutation.mutate();
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link to={ROUTES.feed} className="text-sm text-teal-800 hover:underline">
        ← Back to feed
      </Link>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      >
        {isEditing && mood.canEdit ? (
          <EditMoodForm
            mood={mood}
            onCancel={() => setIsEditing(false)}
            onSaved={() => {
              setIsEditing(false);
              void moodQuery.refetch();
            }}
          />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {mood.tags.map((tag) => (
                <EmotionBadge key={tag.id} name={tag.name} isPrimary={tag.isPrimary} />
              ))}
            </div>

            <p className="whitespace-pre-wrap text-lg text-stone-800">{mood.content}</p>

            {mood.editedAt ? (
              <p className="mt-2 text-xs text-stone-400">Edited {new Date(mood.editedAt).toLocaleString()}</p>
            ) : null}

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
              {mood.isOwner && mood.canEdit ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-teal-800 hover:underline"
                >
                  Edit
                </button>
              ) : null}
              {mood.isOwner ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="text-sm text-red-700 hover:underline disabled:opacity-60"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              ) : null}
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

            {deleteMutation.isError ? (
              <p className="mt-3 text-sm text-red-600">
                {getApiErrorMessage(deleteMutation.error, "Could not delete mood.")}
              </p>
            ) : null}
          </>
        )}
      </motion.article>

      {!isEditing ? <CommentSection moodId={mood.id} /> : null}

      {showReport ? (
        <ReportModal targetType="mood" targetId={mood.id} onClose={() => setShowReport(false)} />
      ) : null}
    </section>
  );
}
