import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../components/EmptyState";
import { queryKeys } from "../constants/queryKeys";
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService";
import { getApiErrorMessage } from "../services/apiClient";

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: () => fetchNotifications(),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });

  if (notificationsQuery.isLoading) {
    return <p className="text-stone-500">Loading notifications...</p>;
  }

  if (notificationsQuery.isError) {
    return (
      <EmptyState
        title="Could not load notifications"
        description={getApiErrorMessage(notificationsQuery.error, "Try again later.")}
      />
    );
  }

  const items = notificationsQuery.data?.data ?? [];
  const unreadCount = notificationsQuery.data?.meta.unreadCount ?? 0;

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Notifications</h1>
          <p className="mt-1 text-sm text-stone-600">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            disabled={markAllMutation.isPending}
            onClick={() => void markAllMutation.mutate()}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
          >
            Mark all read
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Inbox is empty" description="Notifications will appear here." />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border p-4 shadow-sm ${
                item.isRead ? "border-stone-200 bg-white" : "border-teal-200 bg-teal-50/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-stone-900">{item.title}</p>
                  <p className="mt-1 text-sm text-stone-600">{item.body}</p>
                  <p className="mt-2 text-xs text-stone-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!item.isRead ? (
                    <button
                      type="button"
                      onClick={() => void markReadMutation.mutate(item.id)}
                      className="text-xs text-teal-700 hover:underline"
                    >
                      Mark read
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void deleteMutation.mutate(item.id)}
                    className="text-xs text-stone-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
