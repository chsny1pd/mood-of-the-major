import {
  ENGAGEMENT_DEFAULT_LIMIT,
  ENGAGEMENT_MAX_LIMIT,
} from "../../domain/constants/engagementConstants.js";
import type { Bookmark } from "../../domain/entities/Bookmark.js";
import { ConflictError, NotFoundError } from "../../domain/errors/AppError.js";
import type { IBookmarkRepository } from "../../domain/ports/IBookmarkRepository.js";
import type { IMoodRepository, MoodWithRelations } from "../../domain/ports/IMoodRepository.js";
import { buildNextCursor, decodeCursor } from "../../utils/cursorPagination.js";

export interface BookmarkListResult {
  items: MoodWithRelations[];
  meta: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export class BookmarkService {
  constructor(
    private readonly bookmarks: IBookmarkRepository,
    private readonly moods: IMoodRepository,
  ) {}

  async addBookmark(userId: string, moodId: string): Promise<Bookmark> {
    const mood = await this.moods.findByIdIncludingRemoved(moodId);
    if (!mood) {
      throw new NotFoundError("Mood not found", "MOOD_NOT_FOUND");
    }

    const exists = await this.bookmarks.exists(userId, moodId);
    if (exists) {
      throw new ConflictError("Mood is already bookmarked", "BOOKMARK_ALREADY_EXISTS");
    }

    return this.bookmarks.create({ userId, moodId });
  }

  async removeBookmark(userId: string, moodId: string): Promise<void> {
    const removed = await this.bookmarks.deleteByUserAndMood(userId, moodId);
    if (!removed) {
      throw new NotFoundError("Bookmark not found", "BOOKMARK_NOT_FOUND");
    }
  }

  async listBookmarks(userId: string, limitInput?: number, cursor?: string): Promise<BookmarkListResult> {
    const limit = Math.min(limitInput ?? ENGAGEMENT_DEFAULT_LIMIT, ENGAGEMENT_MAX_LIMIT);
    const decoded = cursor ? decodeCursor(cursor) : null;

    const { bookmarks, moods } = await this.bookmarks.listMoodsForUser({
      userId,
      limit,
      cursorCreatedAt: decoded ? new Date(decoded.createdAt) : undefined,
      cursorId: decoded?.id,
    });

    const pagination = buildNextCursor(
      bookmarks.map((bookmark) => ({ id: bookmark.id, createdAt: bookmark.createdAt })),
      limit,
    );

    return {
      items: moods,
      meta: {
        limit,
        nextCursor: pagination.nextCursor,
        hasMore: pagination.hasMore,
      },
    };
  }

  async isBookmarked(userId: string, moodId: string): Promise<boolean> {
    return this.bookmarks.exists(userId, moodId);
  }
}
