import type { CreateNotificationInput, Notification } from "../../../domain/entities/Notification.js";
import type {
  INotificationRepository,
  NotificationListQuery,
} from "../../../domain/ports/INotificationRepository.js";
import { NotificationModel } from "../models/Notification.js";

function toNotification(doc: {
  _id: { toString(): string };
  userId: { toString(): string };
  type: Notification["type"];
  title: string;
  body: string;
  relatedEntityType?: string | null;
  relatedEntityId?: { toString(): string } | null;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Notification {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    title: doc.title,
    body: doc.body,
    relatedEntityType: doc.relatedEntityType ?? null,
    relatedEntityId: doc.relatedEntityId?.toString() ?? null,
    isRead: doc.isRead,
    readAt: doc.readAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongooseNotificationRepository implements INotificationRepository {
  async create(input: CreateNotificationInput): Promise<Notification> {
    const doc = await NotificationModel.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      relatedEntityType: input.relatedEntityType ?? null,
      relatedEntityId: input.relatedEntityId ?? null,
    });

    return toNotification(doc.toObject());
  }

  async findByUser(query: NotificationListQuery): Promise<Notification[]> {
    const filter: Record<string, unknown> = { userId: query.userId };

    if (query.isRead !== undefined) {
      filter.isRead = query.isRead;
    }

    if (query.cursorCreatedAt && query.cursorId) {
      filter.$or = [
        { createdAt: { $lt: query.cursorCreatedAt } },
        { createdAt: query.cursorCreatedAt, _id: { $lt: query.cursorId } },
      ];
    }

    const docs = await NotificationModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(query.limit)
      .lean();

    return docs.map(toNotification);
  }

  async countUnread(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ userId, isRead: false });
  }

  async markRead(notificationId: string, userId: string): Promise<Notification | null> {
    const doc = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { returnDocument: "after" },
    ).lean();

    return doc ? toNotification(doc) : null;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await NotificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return result.modifiedCount;
  }

  async deleteById(notificationId: string, userId: string): Promise<boolean> {
    const result = await NotificationModel.deleteOne({ _id: notificationId, userId });
    return result.deletedCount > 0;
  }
}
