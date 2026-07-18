import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { useLocalizedName } from "../lib/useLocalizedName";
import { fetchSignedImageUrl } from "../services/imageService";
import { deleteMood, fetchMoodById } from "../services/moodService";
import { getApiErrorMessage } from "../services/apiClient";
import { RepostButton } from "../features/repost/components/RepostButton";
import { themeClasses } from "../lib/themeClasses";
import { useAuth } from "../hooks/useAuth";

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
  const { t } = useTranslation();
  const localizedName = useLocalizedName();
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
          title={t("moodDetail.notFoundTitle")}
          description={t("moodDetail.notFoundDescription")}
          action={
            <Link to={ROUTES.feed} className={`text-sm font-medium ${themeClasses.link}`}>
              {t("moodDetail.backToFeed")}
            </Link>
          }
        />
      </section>
    );
  }

  const mood = moodQuery.data;

  const handleDelete = () => {
    if (!window.confirm(t("moodDetail.deleteConfirm"))) {
      return;
    }

    void deleteMutation.mutate();
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link to={ROUTES.feed} className={`text-sm ${themeClasses.link}`}>
        ← {t("moodDetail.backToFeed")}
      </Link>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`mt-6 p-6 ${themeClasses.cardLg}`}
      >
        {mood.isRepost && mood.repostOf ? (
          <p className={`mb-4 text-sm ${themeClasses.muted}`}>
            {t("repost.repostedFrom")}{" "}
            <Link to={ROUTES.moodDetail(mood.repostOf.moodId)} className={themeClasses.linkSubtle}>
              {mood.repostOf.excerpt}
            </Link>
          </p>
        ) : null}
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
                <EmotionBadge
                  key={tag.id}
                  name={localizedName(tag)}
                  slug={tag.slug}
                  isPrimary={tag.isPrimary}
                />
              ))}
            </div>

            <p className={`whitespace-pre-wrap text-lg ${themeClasses.subheading}`}>{mood.content}</p>

            {mood.editedAt ? (
              <p className={`mt-2 text-xs ${themeClasses.faint}`}>
                {t("moodDetail.edited", { date: new Date(mood.editedAt).toLocaleString() })}
              </p>
            ) : null}

            {mood.images.length > 0 ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {mood.images.map((image) => (
                  <MoodImage key={image.id} imageId={image.id} />
                ))}
              </div>
            ) : null}

            <div className={`mt-6 flex flex-wrap gap-3 text-sm ${themeClasses.muted}`}>
              {mood.faculty ? <span>{localizedName(mood.faculty)}</span> : null}
              {mood.major ? <span>{localizedName(mood.major)}</span> : null}
              <span>{new Date(mood.createdAt).toLocaleString()}</span>
            </div>

            <div className={`mt-6 border-t pt-4 ${themeClasses.border}`}>
              <ReactionBar targetType="mood" targetId={mood.id} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <BookmarkButton moodId={mood.id} />
              <RepostButton
                moodId={mood.id}
                hasReposted={mood.hasReposted}
                isRepost={mood.isRepost}
                repostCount={mood.repostCount}
              />
              {mood.isOwner && mood.canEdit ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`text-sm ${themeClasses.link}`}
                >
                  {t("moodDetail.edit")}
                </button>
              ) : null}
              {mood.isOwner ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="text-sm text-red-700 hover:underline disabled:opacity-60 dark:text-red-400"
                >
                  {deleteMutation.isPending ? t("moodDetail.deleting") : t("moodDetail.delete")}
                </button>
              ) : null}
              {isAuthenticated ? (
                <button
                  type="button"
                  data-testid="report-mood-button"
                  onClick={() => setShowReport(true)}
                  className={`text-sm ${themeClasses.muted} hover:text-red-700 dark:hover:text-red-400`}
                >
                  {t("moodDetail.report")}
                </button>
              ) : null}
            </div>

            {deleteMutation.isError ? (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {getApiErrorMessage(deleteMutation.error, t("moodDetail.deleteError"))}
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
