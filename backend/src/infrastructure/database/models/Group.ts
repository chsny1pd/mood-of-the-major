import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const groupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true, default: "" },
    coverImageUrl: { type: String, default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    memberCount: { type: Number, required: true, default: 1, min: 0 },
    status: {
      type: String,
      required: true,
      default: "active",
      enum: ["active", "archived"],
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "groups" },
);

groupSchema.index({ status: 1, deletedAt: 1, createdAt: -1 });
groupSchema.index({ ownerId: 1, deletedAt: 1 });
groupSchema.index({ name: "text", description: "text" });

export type GroupDocument = InferSchemaType<typeof groupSchema> & {
  ownerId: Types.ObjectId;
};

export const GroupModel = model("Group", groupSchema);
