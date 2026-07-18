import type { CreateGroupInput, Group } from "../../../domain/entities/Group.js";
import type { GroupListQuery, IGroupRepository } from "../../../domain/ports/IGroupRepository.js";
import { GroupModel } from "../models/Group.js";

function toGroup(doc: {
  _id: { toString(): string };
  name: string;
  description: string;
  coverImageUrl?: string | null;
  ownerId: { toString(): string };
  memberCount: number;
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}): Group {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    coverImageUrl: doc.coverImageUrl ?? null,
    ownerId: doc.ownerId.toString(),
    memberCount: doc.memberCount,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt ?? null,
  };
}

export class MongooseGroupRepository implements IGroupRepository {
  async create(input: CreateGroupInput): Promise<Group> {
    const doc = await GroupModel.create({
      name: input.name,
      description: input.description,
      coverImageUrl: input.coverImageUrl,
      ownerId: input.ownerId,
      memberCount: 1,
      status: "active",
    });

    return toGroup(doc.toObject());
  }

  async findById(id: string): Promise<Group | null> {
    const doc = await GroupModel.findOne({
      _id: id,
      status: "active",
      deletedAt: null,
    }).lean();

    return doc ? toGroup(doc) : null;
  }

  async list(query: GroupListQuery): Promise<Group[]> {
    const filter: Record<string, unknown> = {
      status: "active",
      deletedAt: null,
    };

    if (query.q?.trim()) {
      const pattern = query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: pattern, $options: "i" };
    }

    if (query.cursorCreatedAt && query.cursorId) {
      filter.$or = [
        { createdAt: { $lt: query.cursorCreatedAt } },
        { createdAt: query.cursorCreatedAt, _id: { $lt: query.cursorId } },
      ];
    }

    const docs = await GroupModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(query.limit)
      .lean();

    return docs.map(toGroup);
  }

  async countOwnedByUser(userId: string): Promise<number> {
    return GroupModel.countDocuments({
      ownerId: userId,
      status: "active",
      deletedAt: null,
    });
  }

  async incrementMemberCount(groupId: string, delta: number): Promise<void> {
    await GroupModel.updateOne({ _id: groupId }, { $inc: { memberCount: delta } });
  }

  async softDelete(groupId: string): Promise<boolean> {
    const result = await GroupModel.updateOne(
      { _id: groupId, deletedAt: null },
      { $set: { deletedAt: new Date(), status: "archived" } },
    );
    return result.modifiedCount > 0;
  }
}
