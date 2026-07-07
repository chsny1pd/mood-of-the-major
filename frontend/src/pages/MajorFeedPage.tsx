import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MoodCard } from "../components/MoodCard";
import { EmptyState } from "../components/EmptyState";
import { MoodCardSkeleton } from "../components/Skeleton";
import { ROUTES } from "../constants/routes";
import { useMoodFeed } from "../features/feed/hooks/useMoodFeed";
import { useLocalizedName } from "../lib/useLocalizedName";
import { fetchMajor } from "../services/referenceService";

export function MajorFeedPage() {
  const { t } = useTranslation();
  const localizedName = useLocalizedName();
  const { majorId = "" } = useParams();
  const majorQuery = useQuery({
    queryKey: ["major", majorId],
    queryFn: () => fetchMajor(majorId),
    enabled: Boolean(majorId),
  });

  const feedQuery = useMoodFeed(
    { type: "major", majorId },
    { enabled: Boolean(majorId) },
  );
  const moods = feedQuery.data?.pages.flatMap((page) => page.data) ?? [];

  const majorName = majorQuery.data
    ? localizedName(majorQuery.data)
    : moods[0]?.major
      ? localizedName(moods[0].major)
      : t("majorFeed.fallbackTitle");

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link to={ROUTES.feed} className="text-sm text-teal-800 hover:underline">
        {t("majorFeed.backToAll")}
      </Link>

      {majorQuery.data?.faculty ? (
        <Link
          to={ROUTES.facultyFeed(majorQuery.data.faculty.slug)}
          className="mt-4 inline-block text-sm text-teal-800 hover:underline"
        >
          {localizedName(majorQuery.data.faculty)}
        </Link>
      ) : null}

      <h1 className="mt-2 text-3xl font-semibold text-stone-900">{majorName}</h1>

      <div className="mt-8 space-y-4">
        {feedQuery.isLoading || majorQuery.isLoading ? (
          <>
            <MoodCardSkeleton />
            <MoodCardSkeleton />
          </>
        ) : feedQuery.isError || majorQuery.isError ? (
          <EmptyState
            title={t("majorFeed.notFoundTitle")}
            description={t("majorFeed.notFoundDescription")}
            action={
              <Link to={ROUTES.feed} className="text-sm font-medium text-teal-800 hover:underline">
                {t("feed.backToFeed")}
              </Link>
            }
          />
        ) : moods.length === 0 ? (
          <EmptyState
            title={t("majorFeed.emptyTitle")}
            description={t("majorFeed.emptyDescription")}
          />
        ) : (
          moods.map((mood) => <MoodCard key={mood.id} mood={mood} />)
        )}
      </div>
    </section>
  );
}
