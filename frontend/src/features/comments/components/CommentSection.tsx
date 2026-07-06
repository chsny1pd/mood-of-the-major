import { useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../constants/queryKeys";
import { createComment, deleteComment, fetchComments } from "../../../services/commentService";
import { useAuth } from "../../../contexts/AuthContext";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import { ReactionBar } from "../../reactions/components/ReactionBar";
import { ReportModal } from "../../report/components/ReportModal";
import { getApiErrorMessage } from "../../../services/apiClient";

interface CommentSectionProps {
  moodId: string;
}

export function CommentSection({ moodId }: CommentSectionProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const commentsQuery = useInfiniteQuery({
    queryKey: queryKeys.moodComments(moodId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchComments(moodId, { cursor: pageParam }),
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
  });

  const mutation = useMutation({
    mutationFn: () =>
      createComment(moodId, {
        content: content.trim(),
        parentId: replyToId,
      }),
    onSuccess: () => {
      setContent("");
      setReplyToId(null);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.moodComments(moodId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.moodDetail(moodId) });
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, "Could not post comment"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.moodComments(moodId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.moodDetail(moodId) });
    },
  });

  const comments = commentsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const replyTarget = replyToId ? comments.find((comment) => comment.id === replyToId) : null;

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-stone-800">
        Comments {comments.length > 0 ? `(${comments.length})` : ""}
      </h2>

      {isAuthenticated ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!content.trim()) return;
            mutation.mutate();
          }}
          className="mb-6 space-y-2"
        >
          {replyTarget ? (
            <p className="text-sm text-stone-600">
              Replying to comment…{" "}
              <button
                type="button"
                onClick={() => setReplyToId(null)}
                className="font-medium text-teal-800 hover:underline"
              >
                Cancel
              </button>
            </p>
          ) : null}
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Share support anonymously..."
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-teal-700 focus:ring-2"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={mutation.isPending || !content.trim()}
            className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60"
          >
            {mutation.isPending ? "Posting..." : replyToId ? "Post reply" : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="mb-6 text-sm text-stone-600">
          <Link to={ROUTES.login} className="font-medium text-teal-800 hover:underline">
            Log in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      {commentsQuery.isLoading ? (
        <div className="space-y-3">
          <div className="h-16 animate-pulse rounded-xl bg-stone-100" />
          <div className="h-16 animate-pulse rounded-xl bg-stone-100" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-stone-500">No comments yet. Be the first to respond.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-xl border border-stone-200 bg-stone-50/50 p-4"
              style={{ marginLeft: `${comment.depth * 1.25}rem` }}
            >
              <p className="whitespace-pre-wrap text-stone-800">{comment.content}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <ReactionBar targetType="comment" targetId={comment.id} compact />
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {isAuthenticated ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setReplyToId(comment.id)}
                        className="text-teal-800 hover:underline"
                      >
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportCommentId(comment.id)}
                        className="text-stone-500 hover:text-red-700"
                      >
                        Report
                      </button>
                      {comment.isOwner ? (
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(comment.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-700 hover:underline disabled:opacity-60"
                        >
                          Delete
                        </button>
                      ) : null}
                    </>
                  ) : null}
                  <time className="text-stone-400">
                    {new Date(comment.createdAt).toLocaleString()}
                  </time>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {commentsQuery.hasNextPage ? (
        <button
          type="button"
          onClick={() => void commentsQuery.fetchNextPage()}
          disabled={commentsQuery.isFetchingNextPage}
          className="mt-4 w-full rounded-xl border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 disabled:opacity-60"
        >
          {commentsQuery.isFetchingNextPage ? "Loading..." : "Load more comments"}
        </button>
      ) : null}

      {reportCommentId ? (
        <ReportModal
          targetType="comment"
          targetId={reportCommentId}
          onClose={() => setReportCommentId(null)}
        />
      ) : null}
    </section>
  );
}
