import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const moodImageSchema = new Schema(
  {
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    moodId: { type: Schema.Types.ObjectId, ref: "Mood", default: null },
    objectKey: { type: String, required: true, trim: true },
    originalFileName: { type: String, default: null },
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      required: true,
      default: "pending",
      enum: ["pending", "confirmed", "orphaned", "deleted"],
    },
    sortOrder: { type: Number, required: true, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    confirmedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "moodimages" },
);

moodImageSchema.index({ objectKey: 1 }, { unique: true });
moodImageSchema.index({ uploadedBy: 1, status: 1, createdAt: -1 });
moodImageSchema.index({ moodId: 1, sortOrder: 1 });
moodImageSchema.index({ status: 1, moodId: 1, createdAt: 1 });

export type MoodImageDocument = InferSchemaType<typeof moodImageSchema> & {
  uploadedBy: Types.ObjectId;
  moodId: Types.ObjectId | null;
};

export const MoodImageModel = model("MoodImage", moodImageSchema);
