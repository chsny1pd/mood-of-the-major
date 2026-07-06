import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../constants/queryKeys";
import { createComment, fetchComments } from "../../../services/commentService";
import { useAuth } from "../../../contexts/AuthContext";
import { Link } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import { ReactionBar } from "../../reactions/components/ReactionBar";
import { getApiErrorMessage } from "../../../services/apiClient";

interface CommentSectionProps {
  moodId: string;
}

export function CommentSection({ moodId }: CommentSectionProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const commentsQuery = useQuery({
    queryKey: queryKeys.moodComments(moodId),
    queryFn: () => fetchComments(moodId),
  });

  const mutation = useMutation({
    mutationFn: () => createComment(moodId, { content: content.trim() }),
    onSuccess: () => {
      setContent("");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: queryKeys.moodComments(moodId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.moodDetail(moodId) });
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, "Could not post comment"));
    },
  });

  const comments = commentsQuery.data?.data ?? [];

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
            {mutation.isPending ? "Posting..." : "Post comment"}
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
                <time className="text-xs text-stone-400">
                  {new Date(comment.createdAt).toLocaleString()}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
