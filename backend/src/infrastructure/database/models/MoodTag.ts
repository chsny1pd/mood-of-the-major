import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const moodTagSchema = new Schema(
  {
    moodId: { type: Schema.Types.ObjectId, ref: "Mood", required: true },
    tagId: { type: Schema.Types.ObjectId, ref: "Tag", required: true },
    isPrimary: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collection: "moodtags" },
);

moodTagSchema.index({ moodId: 1, tagId: 1 }, { unique: true });
moodTagSchema.index({ tagId: 1, moodId: 1 });

export type MoodTagDocument = InferSchemaType<typeof moodTagSchema> & {
  moodId: Types.ObjectId;
  tagId: Types.ObjectId;
};

export const MoodTagModel = model("MoodTag", moodTagSchema);
