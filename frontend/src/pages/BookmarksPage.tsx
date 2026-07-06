import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MoodCard } from "../components/MoodCard";
import { EmptyState } from "../components/EmptyState";
import { MoodCardSkeleton } from "../components/Skeleton";
import { queryKeys } from "../constants/queryKeys";
import { ROUTES } from "../constants/routes";
import { fetchBookmarks } from "../services/bookmarkService";

export function BookmarksPage() {
  const bookmarksQuery = useQuery({
    queryKey: queryKeys.bookmarks(),
    queryFn: () => fetchBookmarks(),
  });

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">Saved moods</h1>
      <p className="mt-1 text-sm text-stone-600">Posts you bookmarked for later.</p>

      {bookmarksQuery.isLoading ? (
        <div className="mt-8 space-y-4">
          <MoodCardSkeleton />
          <MoodCardSkeleton />
        </div>
      ) : bookmarksQuery.isError ? (
        <EmptyState
          title="Could not load bookmarks"
          description="Please try again later."
          action={
            <Link to={ROUTES.feed} className="text-sm font-medium text-teal-800 hover:underline">
              Back to feed
            </Link>
          }
        />
      ) : bookmarksQuery.data?.data.length === 0 ? (
        <EmptyState
          title="No saved moods"
          description="Bookmark posts from the mood detail page."
          action={
            <Link to={ROUTES.feed} className="text-sm font-medium text-teal-800 hover:underline">
              Browse feed
            </Link>
          }
        />
      ) : (
        <div className="mt-8 space-y-4">
          {bookmarksQuery.data?.data.map((mood) => (
            <MoodCard key={mood.id} mood={mood} />
          ))}
        </div>
      )}
    </section>
  );
}
