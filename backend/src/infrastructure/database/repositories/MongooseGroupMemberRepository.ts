import type { GroupMember, GroupMemberRole } from "../../../domain/entities/Group.js";
import type { IGroupMemberRepository } from "../../../domain/ports/IGroupRepository.js";
import { GroupMemberModel } from "../models/GroupMember.js";

function toMember(doc: {
  _id: { toString(): string };
  groupId: { toString(): string };
  userId: { toString(): string };
  role: GroupMemberRole;
  joinedAt?: Date;
  createdAt?: Date;
}): GroupMember {
  return {
    id: doc._id.toString(),
    groupId: doc.groupId.toString(),
    userId: doc.userId.toString(),
    role: doc.role,
    joinedAt: doc.joinedAt ?? doc.createdAt ?? new Date(),
  };
}

export class MongooseGroupMemberRepository implements IGroupMemberRepository {
  async create(input: {
    groupId: string;
    userId: string;
    role: GroupMemberRole;
  }): Promise<GroupMember> {
    const doc = await GroupMemberModel.create({
      groupId: input.groupId,
      userId: input.userId,
      role: input.role,
    });

    const plain = doc.toObject() as {
      _id: { toString(): string };
      groupId: { toString(): string };
      userId: { toString(): string };
      role: GroupMemberRole;
      joinedAt?: Date;
      createdAt?: Date;
    };

    return toMember(plain);
  }

  async findMembership(groupId: string, userId: string): Promise<GroupMember | null> {
    const doc = await GroupMemberModel.findOne({ groupId, userId }).lean();
    return doc
      ? toMember(
          doc as {
            _id: { toString(): string };
            groupId: { toString(): string };
            userId: { toString(): string };
            role: GroupMemberRole;
            joinedAt?: Date;
            createdAt?: Date;
          },
        )
      : null;
  }

  async deleteMembership(groupId: string, userId: string): Promise<boolean> {
    const result = await GroupMemberModel.deleteOne({ groupId, userId });
    return result.deletedCount > 0;
  }

  async listByGroup(groupId: string): Promise<GroupMember[]> {
    const docs = await GroupMemberModel.find({ groupId }).sort({ joinedAt: 1 }).lean();
    return docs.map((doc) =>
      toMember(
        doc as {
          _id: { toString(): string };
          groupId: { toString(): string };
          userId: { toString(): string };
          role: GroupMemberRole;
          joinedAt?: Date;
          createdAt?: Date;
        },
      ),
    );
  }

  async countByGroup(groupId: string): Promise<number> {
    return GroupMemberModel.countDocuments({ groupId });
  }
}
