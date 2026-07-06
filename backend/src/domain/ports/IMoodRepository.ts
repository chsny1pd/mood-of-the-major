import type { CreateMoodInput, Mood } from "../entities/Mood.js";

export interface MoodFeedFilters {
  facultyId?: string;
  majorId?: string;
  tagSlug?: string;
  from?: Date;
  to?: Date;
  sort?: "newest" | "most_reacted" | "most_commented";
}

export interface MoodFeedQuery extends MoodFeedFilters {
  limit: number;
  cursorCreatedAt?: Date;
  cursorId?: string;
}

export interface MoodWithRelations extends Mood {
  faculty: { id: string; name: string; slug: string } | null;
  major: { id: string; name: string; slug: string } | null;
  tagDetails: Array<{
    id: string;
    slug: string;
    name: string;
    isPrimary: boolean;
  }>;
  images: Array<{ id: string; sortOrder: number }>;
}

export interface IMoodRepository {
  create(input: CreateMoodInput): Promise<MoodWithRelations>;
  findById(id: string): Promise<MoodWithRelations | null>;
  findActiveFeed(query: MoodFeedQuery): Promise<MoodWithRelations[]>;
  softDeleteByAuthor(moodId: string, authorId: string): Promise<boolean>;
  isAuthor(moodId: string, authorId: string): Promise<boolean>;
}
