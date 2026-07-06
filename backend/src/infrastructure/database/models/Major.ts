import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const majorSchema = new Schema(
  {
    facultyId: { type: Schema.Types.ObjectId, ref: "Faculty", required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    code: { type: String, default: null },
    isActive: { type: Boolean, required: true, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "majors" },
);

majorSchema.index({ facultyId: 1, slug: 1 }, { unique: true });
majorSchema.index({ facultyId: 1, isActive: 1, sortOrder: 1 });

export type MajorDocument = InferSchemaType<typeof majorSchema> & {
  facultyId: Types.ObjectId;
};

export const MajorModel = model("Major", majorSchema);
