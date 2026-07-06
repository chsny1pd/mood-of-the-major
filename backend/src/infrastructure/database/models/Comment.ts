import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const commentSchema = new Schema(
  {
    moodId: { type: Schema.Types.ObjectId, ref: "Mood", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    content: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      default: "active",
      enum: ["active", "moderated_removed", "deleted_by_author"],
    },
    reactionSummary: { type: Schema.Types.Mixed, required: true, default: {} },
    depth: { type: Number, required: true, default: 0, min: 0 },
    moderatedAt: { type: Date, default: null },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "comments" },
);

commentSchema.index({ moodId: 1, status: 1, createdAt: 1 });
commentSchema.index({ moodId: 1, parentId: 1, createdAt: 1 });
commentSchema.index({ authorId: 1, createdAt: -1 });

export type CommentDocument = InferSchemaType<typeof commentSchema> & {
  moodId: Types.ObjectId;
  authorId: Types.ObjectId;
  parentId: Types.ObjectId | null;
};

export const CommentModel = model("Comment", commentSchema);
