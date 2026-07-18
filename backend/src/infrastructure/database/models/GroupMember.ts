import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export type GroupMemberRole = "owner" | "member";

/** Explicit doc type — InferSchemaType mis-infers Date index signatures when createdAt is renamed. */
export interface GroupMemberAttrs {
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  role: GroupMemberRole;
  joinedAt: Date;
}

const groupMemberSchema = new Schema<GroupMemberAttrs>(
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

export type GroupMemberDocument = HydratedDocument<GroupMemberAttrs>;

export const GroupMemberModel = model<GroupMemberAttrs>("GroupMember", groupMemberSchema);
