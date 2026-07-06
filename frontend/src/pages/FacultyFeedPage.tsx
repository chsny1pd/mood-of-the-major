import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MoodCard } from "../components/MoodCard";
import { EmptyState } from "../components/EmptyState";
import { MoodCardSkeleton } from "../components/Skeleton";
import { ROUTES } from "../constants/routes";
import { useMoodFeed } from "../features/feed/hooks/useMoodFeed";
import { fetchFaculties } from "../services/referenceService";

export function FacultyFeedPage() {
  const { facultyId = "" } = useParams();
  const facultiesQuery = useQuery({ queryKey: ["faculties"], queryFn: fetchFaculties });
  const faculty = facultiesQuery.data?.find((item) => item.id === facultyId || item.slug === facultyId);
  const feedQuery = useMoodFeed({
    type: "faculty",
    facultyId: faculty?.id ?? facultyId,
    params: { facultyId: faculty?.id ?? facultyId },
  });
  const moods = feedQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link to={ROUTES.feed} className="text-sm text-teal-800 hover:underline">
        ← All moods
      </Link>
      <h1 className="mt-4 text-3xl font-semibold text-stone-900">
        {faculty?.name ?? "Faculty feed"}
      </h1>

      <div className="mt-8 space-y-4">
        {feedQuery.isLoading ? (
          <>
            <MoodCardSkeleton />
            <MoodCardSkeleton />
          </>
        ) : moods.length === 0 ? (
          <EmptyState title="No moods in this faculty yet" description="Check back later or share your own." />
        ) : (
          moods.map((mood) => <MoodCard key={mood.id} mood={mood} />)
        )}
      </div>
    </section>
  );
}
