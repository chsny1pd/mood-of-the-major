import type { EmotionTag } from "../entities/Tag.js";

export interface CreateTagInput {
  name: string;
  slug: string;
  type?: "emotion";
  colorToken?: string | null;
  iconKey?: string | null;
  sortOrder?: number;
}

export interface UpdateTagInput {
  name?: string;
  isActive?: boolean;
  sortOrder?: number;
  colorToken?: string | null;
  iconKey?: string | null;
}

export interface ITagRepository {
  findActiveByIds(ids: string[]): Promise<EmotionTag[]>;
  findActiveBySlug(slug: string): Promise<EmotionTag | null>;
  findAllActiveEmotions(): Promise<EmotionTag[]>;
  findAllAdmin(type?: string, includeInactive?: boolean): Promise<EmotionTag[]>;
  findById(id: string): Promise<EmotionTag | null>;
  create(input: CreateTagInput): Promise<EmotionTag>;
  update(id: string, input: UpdateTagInput): Promise<EmotionTag | null>;
}
