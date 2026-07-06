import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { NOTIFICATION_TYPES } from "../../../domain/constants/adminConstants.js";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true, enum: NOTIFICATION_TYPES },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    relatedEntityType: { type: String, default: null },
    relatedEntityId: { type: Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, required: true, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "notifications" },
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  userId: Types.ObjectId;
  relatedEntityId: Types.ObjectId | null;
};

export const NotificationModel = model("Notification", notificationSchema);
