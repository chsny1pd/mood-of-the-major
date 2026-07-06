import type { EmotionTag } from "../../../domain/entities/Tag.js";
import type { ITagRepository } from "../../../domain/ports/ITagRepository.js";
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
}
