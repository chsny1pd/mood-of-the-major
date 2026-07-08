import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const majorSchema = new Schema(
  {
    facultyId: { type: Schema.Types.ObjectId, ref: "Faculty", required: true },
    name: { type: String, required: true, trim: true },
    nameTh: { type: String, trim: true, default: null },
    slug: { type: String, required: true, trim: true, lowercase: true },
    code: { type: String, default: null },
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
  { timestamps: true, collection: "majors" },
);

majorSchema.index({ facultyId: 1, slug: 1 }, { unique: true });
majorSchema.index({ facultyId: 1, isActive: 1, approvalStatus: 1, sortOrder: 1 });
majorSchema.index({ facultyId: 1, name: 1, approvalStatus: 1 });

export type MajorDocument = InferSchemaType<typeof majorSchema> & {
  facultyId: Types.ObjectId;
};

export const MajorModel = model("Major", majorSchema);
