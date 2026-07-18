import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { addBookmark, fetchBookmarkStatus, removeBookmark } from "../../../services/bookmarkService";
import { queryKeys } from "../../../constants/queryKeys";
import { useAuth } from "../../../hooks/useAuth";

interface BookmarkIconButtonProps {
  moodId: string;
}

export function BookmarkIconButton({ moodId }: BookmarkIconButtonProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: queryKeys.bookmarkStatus(moodId),
    queryFn: () => fetchBookmarkStatus(moodId),
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: async (currentlyBookmarked: boolean) => {
      if (currentlyBookmarked) {
        await removeBookmark(moodId);
        return false;
      }
      await addBookmark(moodId);
      return true;
    },
    onMutate: async (currentlyBookmarked) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.bookmarkStatus(moodId) });
      const previous = statusQuery.data ?? false;
      queryClient.setQueryData(queryKeys.bookmarkStatus(moodId), !currentlyBookmarked);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context) {
        queryClient.setQueryData(queryKeys.bookmarkStatus(moodId), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookmarkStatus(moodId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks() });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const bookmarked = statusQuery.data ?? false;

  return (
    <button
      type="button"
      aria-label={bookmarked ? t("bookmarks.removeBookmark") : t("bookmarks.saveMood")}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        mutation.mutate(bookmarked);
      }}
      disabled={mutation.isPending || statusQuery.isLoading}
      className={`rounded-full p-1.5 text-sm transition ${
        bookmarked ? "text-amber-600 hover:bg-amber-50" : "text-stone-400 hover:bg-stone-100 hover:text-orange-700"
      } disabled:opacity-60`}
    >
      {bookmarked ? "★" : "☆"}
    </button>
  );
}
