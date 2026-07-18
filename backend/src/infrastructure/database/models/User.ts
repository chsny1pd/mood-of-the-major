import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    studentId: { type: String, trim: true, uppercase: true, default: null },
    yearOfStudy: { type: Number, min: 1, max: 8, default: null },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      default: "student",
      enum: ["student", "administrator", "advisor"],
    },
    facultyId: { type: Schema.Types.ObjectId, ref: "Faculty", default: null },
    majorId: { type: Schema.Types.ObjectId, ref: "Major", default: null },
    displayName: { type: String, trim: true, default: null },
    realName: { type: String, trim: true, default: null },
    birthYear: { type: Number, min: 1950, max: 2100, default: null },
    avatarUrl: { type: String, trim: true, default: null },
    status: {
      type: String,
      required: true,
      default: "active",
      enum: ["active", "suspended"],
    },
    lastLoginAt: { type: Date, default: null },
    tokenVersion: { type: Number, required: true, default: 0 },
    refreshTokenHash: { type: String, default: null },
    refreshTokenExpiresAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "users" },
);

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } },
);
userSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null, studentId: { $type: "string" } } },
);
userSchema.index({ role: 1, status: 1 });
userSchema.index({ facultyId: 1, majorId: 1 });

export type UserDocument = InferSchemaType<typeof userSchema> & {
  facultyId: Types.ObjectId | null;
  majorId: Types.ObjectId | null;
};

export const UserModel = model("User", userSchema);
