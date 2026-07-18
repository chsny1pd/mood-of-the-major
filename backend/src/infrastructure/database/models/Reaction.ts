import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const reactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, required: true, enum: ["mood", "comment"] },
    targetId: { type: Schema.Types.ObjectId, required: true },
    emoji: { type: String, required: true, maxlength: 8 },
  },
  { timestamps: true, collection: "reactions" },
);

reactionSchema.index(
  { userId: 1, targetType: 1, targetId: 1, emoji: 1 },
  { unique: true },
);
reactionSchema.index({ targetType: 1, targetId: 1 });
reactionSchema.index({ userId: 1, targetType: 1, targetId: 1 });

export type ReactionDocument = InferSchemaType<typeof reactionSchema> & {
  userId: Types.ObjectId;
  targetId: Types.ObjectId;
};

export const ReactionModel = model("Reaction", reactionSchema);
