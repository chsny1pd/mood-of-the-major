import { Schema, model, type InferSchemaType } from "mongoose";

const facultySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    nameTh: { type: String, trim: true, default: null },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    code: { type: String, default: null },
    description: { type: String, default: null },
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
  { timestamps: true, collection: "faculties" },
);

facultySchema.index({ isActive: 1, approvalStatus: 1, sortOrder: 1 });
facultySchema.index({ name: 1, approvalStatus: 1 });

export type FacultyDocument = InferSchemaType<typeof facultySchema>;
export const FacultyModel = model("Faculty", facultySchema);
