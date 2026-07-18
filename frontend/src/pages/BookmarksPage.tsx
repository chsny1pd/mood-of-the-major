import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MoodCard } from "../components/MoodCard";
import { EmptyState } from "../components/EmptyState";
import { MoodCardSkeleton } from "../components/Skeleton";
import { queryKeys } from "../constants/queryKeys";
import { ROUTES } from "../constants/routes";
import { fetchBookmarks } from "../services/bookmarkService";
import { themeClasses } from "../lib/themeClasses";

export function BookmarksPage() {
  const { t } = useTranslation();
  const bookmarksQuery = useInfiniteQuery({
    queryKey: queryKeys.bookmarks(),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchBookmarks({ cursor: pageParam }),
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
  });

  const moods = bookmarksQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className={themeClasses.pageTitle}>{t("bookmarks.pageTitle")}</h1>
      <p className="mt-1 text-sm text-stone-600">{t("bookmarks.description")}</p>

      {bookmarksQuery.isLoading ? (
        <div className="mt-8 space-y-4">
          <MoodCardSkeleton />
          <MoodCardSkeleton />
        </div>
      ) : bookmarksQuery.isError ? (
        <EmptyState
          title={t("bookmarks.loadErrorTitle")}
          description={t("bookmarks.loadErrorDescription")}
          action={
            <Link to={ROUTES.feed} className="text-sm font-medium text-orange-800 hover:underline">
              {t("bookmarks.backToFeed")}
            </Link>
          }
        />
      ) : moods.length === 0 ? (
        <EmptyState
          title={t("bookmarks.emptyTitle")}
          description={t("bookmarks.emptyDescription")}
          action={
            <Link to={ROUTES.feed} className="text-sm font-medium text-orange-800 hover:underline">
              {t("bookmarks.browseFeed")}
            </Link>
          }
        />
      ) : (
        <div className="mt-8 space-y-4">
          {moods.map((mood) => (
            <MoodCard key={mood.id} mood={mood} showBookmark />
          ))}

          {bookmarksQuery.hasNextPage ? (
            <button
              type="button"
              onClick={() => void bookmarksQuery.fetchNextPage()}
              disabled={bookmarksQuery.isFetchingNextPage}
              className="w-full rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-60"
            >
              {bookmarksQuery.isFetchingNextPage ? t("common.loading") : t("feed.loadMore")}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
