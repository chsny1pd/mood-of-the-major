import { Schema, model, type InferSchemaType } from "mongoose";

const tagSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    nameTh: { type: String, trim: true, default: null },
    slug: { type: String, required: true, trim: true, lowercase: true },
    type: { type: String, required: true, default: "emotion", enum: ["emotion"] },
    colorToken: { type: String, default: null },
    iconKey: { type: String, default: null },
    isActive: { type: Boolean, required: true, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "tags" },
);

tagSchema.index({ type: 1, slug: 1 }, { unique: true });
tagSchema.index({ type: 1, isActive: 1, sortOrder: 1 });

export type TagDocument = InferSchemaType<typeof tagSchema>;
export const TagModel = model("Tag", tagSchema);
