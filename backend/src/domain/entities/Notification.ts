import type { NotificationType } from "../constants/adminConstants.js";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}
