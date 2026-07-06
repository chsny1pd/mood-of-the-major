import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addBookmark, fetchBookmarkStatus, removeBookmark } from "../../../services/bookmarkService";
import { queryKeys } from "../../../constants/queryKeys";
import { getApiErrorMessage } from "../../../services/apiClient";
import { useAuth } from "../../../contexts/AuthContext";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";

interface BookmarkButtonProps {
  moodId: string;
}

export function BookmarkButton({ moodId }: BookmarkButtonProps) {
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
    return (
      <Link to={ROUTES.login} className="text-sm text-stone-500 hover:text-teal-800">
        Log in to save
      </Link>
    );
  }

  if (statusQuery.isLoading) {
    return <span className="text-sm text-stone-400">Loading...</span>;
  }

  const bookmarked = statusQuery.data ?? false;
  const errorMessage = mutation.isError
    ? getApiErrorMessage(mutation.error, "Could not update bookmark")
    : statusQuery.isError
      ? getApiErrorMessage(statusQuery.error, "Could not load bookmark status")
      : null;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => mutation.mutate(bookmarked)}
        disabled={mutation.isPending || statusQuery.isError}
        className={`rounded-full border px-3 py-1 text-sm transition ${
          bookmarked
            ? "border-amber-400 bg-amber-50 text-amber-900"
            : "border-stone-300 text-stone-600 hover:border-teal-400"
        } disabled:opacity-60`}
      >
        {mutation.isPending ? "Saving..." : bookmarked ? "Saved" : "Save"}
      </button>
      {errorMessage ? <span className="text-xs text-red-600">{errorMessage}</span> : null}
    </div>
  );
}
