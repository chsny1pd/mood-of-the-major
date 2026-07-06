import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MoodCard } from "../components/MoodCard";
import { EmptyState } from "../components/EmptyState";
import { MoodCardSkeleton } from "../components/Skeleton";
import { ROUTES } from "../constants/routes";
import { useMoodFeed } from "../features/feed/hooks/useMoodFeed";
import { fetchMajor } from "../services/referenceService";

export function MajorFeedPage() {
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

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link to={ROUTES.feed} className="text-sm text-teal-800 hover:underline">
        ← All moods
      </Link>

      {majorQuery.data?.faculty ? (
        <Link
          to={ROUTES.facultyFeed(majorQuery.data.faculty.slug)}
          className="mt-4 inline-block text-sm text-teal-800 hover:underline"
        >
          {majorQuery.data.faculty.name}
        </Link>
      ) : null}

      <h1 className="mt-2 text-3xl font-semibold text-stone-900">
        {majorQuery.data?.name ?? moods[0]?.major?.name ?? "Major feed"}
      </h1>

      <div className="mt-8 space-y-4">
        {feedQuery.isLoading || majorQuery.isLoading ? (
          <>
            <MoodCardSkeleton />
            <MoodCardSkeleton />
          </>
        ) : feedQuery.isError || majorQuery.isError ? (
          <EmptyState
            title="Major not found"
            description="This major does not exist or is inactive."
            action={
              <Link to={ROUTES.feed} className="text-sm font-medium text-teal-800 hover:underline">
                Back to feed
              </Link>
            }
          />
        ) : moods.length === 0 ? (
          <EmptyState title="No moods in this major yet" description="Check back later or share your own." />
        ) : (
          moods.map((mood) => <MoodCard key={mood.id} mood={mood} />)
        )}
      </div>
    </section>
  );
}
