import type { Bookmark, CreateBookmarkInput } from "../entities/Bookmark.js";
import type { MoodWithRelations } from "./IMoodRepository.js";

export interface BookmarkListQuery {
  userId: string;
  limit: number;
  cursorCreatedAt?: Date;
  cursorId?: string;
}

export interface IBookmarkRepository {
  create(input: CreateBookmarkInput): Promise<Bookmark>;
  deleteByUserAndMood(userId: string, moodId: string): Promise<boolean>;
  exists(userId: string, moodId: string): Promise<boolean>;
  listMoodsForUser(query: BookmarkListQuery): Promise<{
    bookmarks: Bookmark[];
    moods: MoodWithRelations[];
  }>;
}
