import type { Bookmark, CreateBookmarkInput } from "../../../domain/entities/Bookmark.js";
import type {
  BookmarkListQuery,
  IBookmarkRepository,
} from "../../../domain/ports/IBookmarkRepository.js";
import type { MoodWithRelations } from "../../../domain/ports/IMoodRepository.js";
import { BookmarkModel } from "../models/Bookmark.js";
import { MongooseMoodRepository } from "./MongooseMoodRepository.js";

function toBookmark(doc: {
  _id: { toString(): string };
  userId: { toString(): string };
  moodId: { toString(): string };
  createdAt: Date;
}): Bookmark {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    moodId: doc.moodId.toString(),
    createdAt: doc.createdAt,
  };
}

export class MongooseBookmarkRepository implements IBookmarkRepository {
  private readonly moods = new MongooseMoodRepository();

  async create(input: CreateBookmarkInput): Promise<Bookmark> {
    const doc = await BookmarkModel.create({
      userId: input.userId,
      moodId: input.moodId,
    });

    return toBookmark(doc.toObject());
  }

  async deleteByUserAndMood(userId: string, moodId: string): Promise<boolean> {
    const result = await BookmarkModel.deleteOne({ userId, moodId });
    return result.deletedCount > 0;
  }

  async exists(userId: string, moodId: string): Promise<boolean> {
    const count = await BookmarkModel.countDocuments({ userId, moodId });
    return count > 0;
  }

  async listMoodsForUser(query: BookmarkListQuery): Promise<{
    bookmarks: Bookmark[];
    moods: MoodWithRelations[];
  }> {
    const filter: Record<string, unknown> = { userId: query.userId };

    if (query.cursorCreatedAt && query.cursorId) {
      filter.$or = [
        { createdAt: { $lt: query.cursorCreatedAt } },
        { createdAt: query.cursorCreatedAt, _id: { $lt: query.cursorId } },
      ];
    }

    const bookmarkDocs = await BookmarkModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(query.limit)
      .lean();

    const bookmarks = bookmarkDocs.map(toBookmark);
    const moods: MoodWithRelations[] = [];

    for (const bookmark of bookmarks) {
      const mood = await this.moods.findByIdIncludingRemoved(bookmark.moodId);
      if (mood) moods.push(mood);
    }

    return { bookmarks, moods };
  }
}
