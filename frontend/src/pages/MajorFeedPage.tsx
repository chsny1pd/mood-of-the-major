import { Link, useParams } from "react-router-dom";
import { MoodCard } from "../components/MoodCard";
import { EmptyState } from "../components/EmptyState";
import { MoodCardSkeleton } from "../components/Skeleton";
import { ROUTES } from "../constants/routes";
import { useMoodFeed } from "../features/feed/hooks/useMoodFeed";

export function MajorFeedPage() {
  const { majorId = "" } = useParams();
  const feedQuery = useMoodFeed({ type: "major", majorId });
  const moods = feedQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const majorName = moods[0]?.major?.name ?? "Major feed";

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link to={ROUTES.feed} className="text-sm text-teal-800 hover:underline">
        ← All moods
      </Link>
      <h1 className="mt-4 text-3xl font-semibold text-stone-900">{majorName}</h1>

      <div className="mt-8 space-y-4">
        {feedQuery.isLoading ? (
          <>
            <MoodCardSkeleton />
            <MoodCardSkeleton />
          </>
        ) : moods.length === 0 ? (
          <EmptyState title="No moods in this major yet" description="Check back later or share your own." />
        ) : (
          moods.map((mood) => <MoodCard key={mood.id} mood={mood} />)
        )}
      </div>
    </section>
  );
}
