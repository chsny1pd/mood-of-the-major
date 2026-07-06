import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const bookmarkSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    moodId: { type: Schema.Types.ObjectId, ref: "Mood", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "bookmarks" },
);

bookmarkSchema.index({ userId: 1, moodId: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1, createdAt: -1 });

export type BookmarkDocument = InferSchemaType<typeof bookmarkSchema> & {
  userId: Types.ObjectId;
  moodId: Types.ObjectId;
};

export const BookmarkModel = model("Bookmark", bookmarkSchema);
