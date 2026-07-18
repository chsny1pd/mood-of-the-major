import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MoodCard } from "../components/MoodCard";
import { EmptyState } from "../components/EmptyState";
import { MoodCardSkeleton } from "../components/Skeleton";
import { ROUTES } from "../constants/routes";
import { useMoodFeed } from "../features/feed/hooks/useMoodFeed";
import { useLocalizedName } from "../lib/useLocalizedName";
import { fetchFaculties } from "../services/referenceService";

export function FacultyFeedPage() {
  const { t } = useTranslation();
  const localizedName = useLocalizedName();
  const { facultyId = "" } = useParams();
  const facultiesQuery = useQuery({ queryKey: ["faculties"], queryFn: fetchFaculties });
  const faculty = facultiesQuery.data?.find(
    (item) => item.id === facultyId || item.slug === facultyId,
  );

  const feedQuery = useMoodFeed(
    { type: "faculty", facultyId },
    { enabled: Boolean(facultyId) },
  );
  const moods = feedQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link to={ROUTES.feed} className="text-sm text-orange-800 hover:underline">
        {t("facultyFeed.backToAll")}
      </Link>
      <h1 className="mt-4 text-3xl font-semibold text-stone-900">
        {faculty ? localizedName(faculty) : t("facultyFeed.fallbackTitle")}
      </h1>

      <div className="mt-8 space-y-4">
        {feedQuery.isLoading ? (
          <>
            <MoodCardSkeleton />
            <MoodCardSkeleton />
          </>
        ) : feedQuery.isError ? (
          <EmptyState
            title={t("facultyFeed.notFoundTitle")}
            description={t("facultyFeed.notFoundDescription")}
            action={
              <Link to={ROUTES.feed} className="text-sm font-medium text-orange-800 hover:underline">
                {t("feed.backToFeed")}
              </Link>
            }
          />
        ) : moods.length === 0 ? (
          <EmptyState
            title={t("facultyFeed.emptyTitle")}
            description={t("facultyFeed.emptyDescription")}
          />
        ) : (
          moods.map((mood) => <MoodCard key={mood.id} mood={mood} />)
        )}
      </div>
    </section>
  );
}
