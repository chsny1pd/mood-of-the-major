import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const groupMemberSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      required: true,
      enum: ["owner", "member"],
      default: "member",
    },
  },
  { timestamps: { createdAt: "joinedAt", updatedAt: false }, collection: "groupmembers" },
);

groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
groupMemberSchema.index({ userId: 1, joinedAt: -1 });
groupMemberSchema.index({ groupId: 1, joinedAt: -1 });

export type GroupMemberDocument = InferSchemaType<typeof groupMemberSchema> & {
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
};

export const GroupMemberModel = model("GroupMember", groupMemberSchema);
