import { Schema, model, type InferSchemaType } from "mongoose";

const facultySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    nameTh: { type: String, trim: true, default: null },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    code: { type: String, default: null },
    description: { type: String, default: null },
    isActive: { type: Boolean, required: true, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "faculties" },
);

facultySchema.index({ isActive: 1, sortOrder: 1 });

export type FacultyDocument = InferSchemaType<typeof facultySchema>;
export const FacultyModel = model("Faculty", facultySchema);
