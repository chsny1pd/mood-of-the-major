import type { CreateNotificationInput, Notification } from "../../domain/entities/Notification.js";
import { NotFoundError } from "../../domain/errors/AppError.js";
import type { INotificationRepository } from "../../domain/ports/INotificationRepository.js";
import { buildNextCursor, decodeCursor } from "../../utils/cursorPagination.js";
import {
  ADMIN_DEFAULT_PAGE_LIMIT,
  ADMIN_MAX_PAGE_LIMIT,
} from "../../domain/constants/adminConstants.js";

export class NotificationService {
  constructor(private readonly notifications: INotificationRepository) {}

  async listForUser(
    userId: string,
    input: { isRead?: boolean; limit?: number; cursor?: string },
  ) {
    const limit = Math.min(input.limit ?? ADMIN_DEFAULT_PAGE_LIMIT, ADMIN_MAX_PAGE_LIMIT);
    const cursor = input.cursor ? decodeCursor(input.cursor) : null;

    const items = await this.notifications.findByUser({
      userId,
      isRead: input.isRead,
      limit,
      cursorCreatedAt: cursor ? new Date(cursor.createdAt) : undefined,
      cursorId: cursor?.id,
    });

    const unreadCount = await this.notifications.countUnread(userId);
    const { nextCursor, hasMore } = buildNextCursor(items, limit);

    return {
      items: items.map((item) => this.toDto(item)),
      meta: { unreadCount, limit, nextCursor, hasMore },
    };
  }

  async markRead(userId: string, notificationId: string) {
    const updated = await this.notifications.markRead(notificationId, userId);
    if (!updated) {
      throw new NotFoundError("Notification not found", "RESOURCE_NOT_FOUND");
    }

    return this.toDto(updated);
  }

  async markAllRead(userId: string) {
    const markedCount = await this.notifications.markAllRead(userId);
    return { markedCount };
  }

  async delete(userId: string, notificationId: string) {
    const deleted = await this.notifications.deleteById(notificationId, userId);
    if (!deleted) {
      throw new NotFoundError("Notification not found", "RESOURCE_NOT_FOUND");
    }
  }

  async notify(input: CreateNotificationInput) {
    const notification = await this.notifications.create(input);
    return this.toDto(notification);
  }

  private toDto(notification: Notification) {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      relatedEntityType: notification.relatedEntityType,
      relatedEntityId: notification.relatedEntityId,
      isRead: notification.isRead,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
