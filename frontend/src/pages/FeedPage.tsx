import { Link } from "react-router-dom";
import { MoodCard } from "../components/MoodCard";
import { EmptyState } from "../components/EmptyState";
import { MoodCardSkeleton } from "../components/Skeleton";
import { ROUTES } from "../constants/routes";
import { useMoodFeed } from "../features/feed/hooks/useMoodFeed";

export function FeedPage() {
  const feedQuery = useMoodFeed({ type: "global" });
  const moods = feedQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-stone-900">Mood feed</h1>
          <p className="mt-2 text-stone-600">Anonymous posts from students across campus.</p>
        </div>
        <Link
          to={ROUTES.create}
          className="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Share mood
        </Link>
      </div>

      {feedQuery.isLoading ? (
        <div className="space-y-4">
          <MoodCardSkeleton />
          <MoodCardSkeleton />
        </div>
      ) : feedQuery.isError ? (
        <EmptyState
          title="Could not load feed"
          description="Please check your connection and try again."
          action={
            <button
              type="button"
              onClick={() => void feedQuery.refetch()}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100"
            >
              Retry
            </button>
          }
        />
      ) : moods.length === 0 ? (
        <EmptyState
          title="No moods yet"
          description="Be the first to share how you're feeling."
          action={
            <Link
              to={ROUTES.create}
              className="inline-block rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Create a mood
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {moods.map((mood) => (
            <MoodCard key={mood.id} mood={mood} />
          ))}

          {feedQuery.hasNextPage ? (
            <button
              type="button"
              onClick={() => void feedQuery.fetchNextPage()}
              disabled={feedQuery.isFetchingNextPage}
              className="w-full rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-60"
            >
              {feedQuery.isFetchingNextPage ? "Loading..." : "Load more"}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
