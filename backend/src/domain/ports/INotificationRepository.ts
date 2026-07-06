import type { CreateNotificationInput, Notification } from "../entities/Notification.js";

export interface NotificationListQuery {
  userId: string;
  isRead?: boolean;
  limit: number;
  cursorCreatedAt?: Date;
  cursorId?: string;
}

export interface INotificationRepository {
  create(input: CreateNotificationInput): Promise<Notification>;
  findByUser(query: NotificationListQuery): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  markRead(notificationId: string, userId: string): Promise<Notification | null>;
  markAllRead(userId: string): Promise<number>;
  deleteById(notificationId: string, userId: string): Promise<boolean>;
}
