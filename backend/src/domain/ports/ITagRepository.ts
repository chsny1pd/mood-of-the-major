import type { EmotionTag } from "../entities/Tag.js";

export interface ITagRepository {
  findActiveByIds(ids: string[]): Promise<EmotionTag[]>;
  findActiveBySlug(slug: string): Promise<EmotionTag | null>;
  findAllActiveEmotions(): Promise<EmotionTag[]>;
}
