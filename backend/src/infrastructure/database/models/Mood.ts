import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const moodSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    facultyId: { type: Schema.Types.ObjectId, ref: "Faculty", default: null },
    majorId: { type: Schema.Types.ObjectId, ref: "Major", default: null },
    status: {
      type: String,
      required: true,
      default: "active",
      enum: ["active", "hidden", "moderated_removed", "deleted_by_author"],
    },
    commentCount: { type: Number, required: true, default: 0, min: 0 },
    reactionSummary: { type: Schema.Types.Mixed, required: true, default: {} },
    imageCount: { type: Number, required: true, default: 0, min: 0 },
    primaryTagId: { type: Schema.Types.ObjectId, ref: "Tag", default: null },
    reportCount: { type: Number, required: true, default: 0, min: 0 },
    lastActivityAt: { type: Date, required: true, default: () => new Date() },
    editedAt: { type: Date, default: null },
    moderatedAt: { type: Date, default: null },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    moderationNote: { type: String, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "moods" },
);

moodSchema.index({ status: 1, createdAt: -1 });
moodSchema.index({ status: 1, facultyId: 1, createdAt: -1 });
moodSchema.index({ status: 1, majorId: 1, createdAt: -1 });
moodSchema.index({ status: 1, primaryTagId: 1, createdAt: -1 });
moodSchema.index({ status: 1, lastActivityAt: -1 });
moodSchema.index({ authorId: 1, createdAt: -1 });
moodSchema.index({ createdAt: -1, _id: -1 });
moodSchema.index({ content: "text" });

export type MoodDocument = InferSchemaType<typeof moodSchema> & {
  authorId: Types.ObjectId;
  facultyId: Types.ObjectId | null;
  majorId: Types.ObjectId | null;
  primaryTagId: Types.ObjectId | null;
};

export const MoodModel = model("Mood", moodSchema);
