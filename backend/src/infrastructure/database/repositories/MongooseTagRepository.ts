import type { EmotionTag } from "../../../domain/entities/Tag.js";
import type {
  CreateTagInput,
  ITagRepository,
  UpdateTagInput,
} from "../../../domain/ports/ITagRepository.js";
import { TagModel } from "../models/Tag.js";

function toEmotionTag(doc: {
  _id: { toString(): string };
  name: string;
  slug: string;
  colorToken?: string | null;
  iconKey?: string | null;
  isActive: boolean;
  sortOrder?: number | null;
}): EmotionTag {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    colorToken: doc.colorToken ?? null,
    iconKey: doc.iconKey ?? null,
    isActive: doc.isActive,
    sortOrder: doc.sortOrder ?? 0,
  };
}

export class MongooseTagRepository implements ITagRepository {
  async findActiveByIds(ids: string[]): Promise<EmotionTag[]> {
    if (ids.length === 0) return [];

    const tags = await TagModel.find({
      _id: { $in: ids },
      type: "emotion",
      isActive: true,
    }).lean();

    return tags.map(toEmotionTag);
  }

  async findActiveBySlug(slug: string): Promise<EmotionTag | null> {
    const tag = await TagModel.findOne({
      slug: slug.toLowerCase(),
      type: "emotion",
      isActive: true,
    }).lean();

    return tag ? toEmotionTag(tag) : null;
  }

  async findAllActiveEmotions(): Promise<EmotionTag[]> {
    const tags = await TagModel.find({ type: "emotion", isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return tags.map(toEmotionTag);
  }

  async findAllAdmin(type = "emotion", includeInactive = false): Promise<EmotionTag[]> {
    const filter: Record<string, unknown> = { type };

    if (!includeInactive) {
      filter.isActive = true;
    }

    const tags = await TagModel.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
    return tags.map(toEmotionTag);
  }

  async findById(id: string): Promise<EmotionTag | null> {
    const tag = await TagModel.findById(id).lean();
    return tag ? toEmotionTag(tag) : null;
  }

  async create(input: CreateTagInput): Promise<EmotionTag> {
    const doc = await TagModel.create({
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      type: input.type ?? "emotion",
      colorToken: input.colorToken ?? null,
      iconKey: input.iconKey ?? null,
      isActive: true,
      sortOrder: input.sortOrder ?? 0,
    });

    return toEmotionTag(doc.toObject());
  }

  async update(id: string, input: UpdateTagInput): Promise<EmotionTag | null> {
    const patch: Record<string, unknown> = {};

    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
    if (input.colorToken !== undefined) patch.colorToken = input.colorToken;
    if (input.iconKey !== undefined) patch.iconKey = input.iconKey;

    const doc = await TagModel.findByIdAndUpdate(id, patch, { returnDocument: "after" }).lean();
    return doc ? toEmotionTag(doc) : null;
  }
}
