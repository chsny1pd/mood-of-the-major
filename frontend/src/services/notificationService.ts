import { apiClient } from "./apiClient";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export async function fetchNotifications(params?: { isRead?: boolean; cursor?: string }) {
  const response = await apiClient.get<{
    success: true;
    data: NotificationItem[];
    meta: { unreadCount: number; limit: number; nextCursor: string | null; hasMore: boolean };
  }>("/notifications", { params });
  return response.data;
}

export async function markNotificationRead(notificationId: string) {
  const response = await apiClient.patch<{ success: true; data: NotificationItem }>(
    `/notifications/${notificationId}/read`,
  );
  return response.data.data;
}

export async function markAllNotificationsRead() {
  const response = await apiClient.post<{ success: true; data: { markedCount: number } }>(
    "/notifications/read-all",
  );
  return response.data.data;
}

export async function deleteNotification(notificationId: string) {
  await apiClient.delete(`/notifications/${notificationId}`);
}
