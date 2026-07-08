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
    approvalStatus: {
      type: String,
      required: true,
      default: "approved",
      enum: ["pending", "approved", "rejected"],
    },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "tags" },
);

tagSchema.index({ type: 1, slug: 1 }, { unique: true });
tagSchema.index({ type: 1, isActive: 1, approvalStatus: 1, sortOrder: 1 });
tagSchema.index({ type: 1, name: 1, approvalStatus: 1 });

export type TagDocument = InferSchemaType<typeof tagSchema>;
export const TagModel = model("Tag", tagSchema);
