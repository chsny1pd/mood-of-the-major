import {
  FEED_DEFAULT_LIMIT,
  FEED_MAX_LIMIT,
  GUEST_FEED_MAX_LIMIT,
  MAX_IMAGES_PER_MOOD,
  MOOD_CONTENT_MAX_LENGTH,
  MOOD_CONTENT_MIN_LENGTH,
} from "../../domain/constants/moodConstants.js";
import {
  AppError,
  AuthorizationError,
  ValidationError,
} from "../../domain/errors/AppError.js";
import type { IFacultyRepository } from "../../domain/ports/IFacultyRepository.js";
import type { IMoodImageRepository } from "../../domain/ports/IMoodImageRepository.js";
import type { MoodFeedFilters, MoodWithRelations } from "../../domain/ports/IMoodRepository.js";
import type { IMoodRepository } from "../../domain/ports/IMoodRepository.js";
import type { ITagRepository } from "../../domain/ports/ITagRepository.js";
import type { IUserRepository } from "../../domain/ports/IUserRepository.js";
import { buildNextCursor, decodeCursor } from "../../utils/cursorPagination.js";

export interface CreateMoodServiceInput {
  content: string;
  facultyId?: string;
  majorId?: string;
  tagIds: string[];
  primaryTagId: string;
  imageIds?: string[];
}

export interface FeedQueryInput extends Omit<MoodFeedFilters, "from" | "to"> {
  limit?: number;
  cursor?: string;
  isAuthenticated?: boolean;
  from?: string;
  to?: string;
}

export interface FeedResult {
  items: MoodWithRelations[];
  meta: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export class MoodService {
  constructor(
    private readonly moods: IMoodRepository,
    private readonly moodImages: IMoodImageRepository,
    private readonly tags: ITagRepository,
    private readonly faculties: IFacultyRepository,
    private readonly users: IUserRepository,
  ) {}

  async createMood(userId: string, input: CreateMoodServiceInput): Promise<MoodWithRelations> {
    const content = input.content.trim();

    if (content.length < MOOD_CONTENT_MIN_LENGTH || content.length > MOOD_CONTENT_MAX_LENGTH) {
      throw new ValidationError("Invalid content", [
        {
          field: "content",
          message: `Content must be between ${MOOD_CONTENT_MIN_LENGTH} and ${MOOD_CONTENT_MAX_LENGTH} characters.`,
        },
      ]);
    }

    if (input.tagIds.length === 0) {
      throw new ValidationError("Tags required", [
        { field: "tagIds", message: "At least one emotion tag is required." },
      ]);
    }

    if (!input.tagIds.includes(input.primaryTagId)) {
      throw new ValidationError("Invalid primary tag", [
        { field: "primaryTagId", message: "Primary tag must be included in tagIds." },
      ]);
    }

    const imageIds = input.imageIds ?? [];

    if (imageIds.length > MAX_IMAGES_PER_MOOD) {
      throw new ValidationError("Too many images", [
        {
          field: "imageIds",
          message: `A mood can have at most ${MAX_IMAGES_PER_MOOD} images.`,
        },
      ]);
    }

    const activeTags = await this.tags.findActiveByIds(input.tagIds);

    if (activeTags.length !== input.tagIds.length) {
      throw new ValidationError("Invalid tags", [
        { field: "tagIds", message: "One or more tags are invalid or inactive." },
      ]);
    }

    const user = await this.users.findById(userId);

    if (!user) {
      throw new AppError("User not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    let facultyId = input.facultyId ?? user.facultyId;
    const majorId = input.majorId ?? user.majorId;

    if (facultyId) {
      const faculty = await this.faculties.findActiveById(facultyId);
      if (!faculty) {
        throw new ValidationError("Invalid faculty", [
          { field: "facultyId", message: "Faculty not found or inactive." },
        ]);
      }
    }

    if (majorId) {
      const major = await this.faculties.findActiveMajorByIdOnly(majorId);
      if (!major) {
        throw new ValidationError("Invalid major", [
          { field: "majorId", message: "Major not found or inactive." },
        ]);
      }

      if (facultyId && major.facultyId !== facultyId) {
        throw new ValidationError("Major does not belong to faculty", [
          { field: "majorId", message: "Selected major does not belong to the selected faculty." },
        ]);
      }

      facultyId = facultyId ?? major.facultyId;
    }

    if (imageIds.length > 0) {
      const images = await this.moodImages.findByIds(imageIds);

      if (images.length !== imageIds.length) {
        throw new ValidationError("Invalid images", [
          { field: "imageIds", message: "One or more images were not found." },
        ]);
      }

      for (const image of images) {
        if (image.uploadedBy !== userId) {
          throw new AuthorizationError("Cannot attach images you did not upload", "FORBIDDEN");
        }

        if (image.status !== "confirmed") {
          throw new ValidationError("Image not confirmed", [
            { field: "imageIds", message: "All images must be confirmed before publishing." },
          ]);
        }

        if (image.moodId) {
          throw new ValidationError("Image already linked", [
            { field: "imageIds", message: "One or more images are already attached to a mood." },
          ]);
        }
      }
    }

    const mood = await this.moods.create({
      authorId: userId,
      content,
      facultyId: facultyId ?? null,
      majorId: majorId ?? null,
      tagIds: input.tagIds,
      primaryTagId: input.primaryTagId,
      imageIds,
    });

    if (imageIds.length > 0) {
      await this.moodImages.linkToMood(imageIds, mood.id, userId);
    }

    return mood;
  }

  async getMood(moodId: string): Promise<MoodWithRelations> {
    const mood = await this.moods.findById(moodId);

    if (!mood) {
      throw new AppError("Mood not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    return mood;
  }

  async deleteMood(userId: string, moodId: string, isAdmin = false): Promise<{ message: string }> {
    if (!isAdmin) {
      const isOwner = await this.moods.isAuthor(moodId, userId);

      if (!isOwner) {
        throw new AuthorizationError("You can only delete your own moods", "NOT_OWNER");
      }
    }

    const deleted = await this.moods.softDeleteByAuthor(moodId, userId);

    if (!deleted && !isAdmin) {
      throw new AppError("Mood not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    await this.moodImages.softDeleteByMoodId(moodId);

    return { message: "Mood deleted successfully." };
  }

  async getFeed(input: FeedQueryInput): Promise<FeedResult> {
    const maxLimit = input.isAuthenticated ? FEED_MAX_LIMIT : GUEST_FEED_MAX_LIMIT;
    const limit = Math.min(Math.max(input.limit ?? FEED_DEFAULT_LIMIT, 1), maxLimit);

    let cursorCreatedAt: Date | undefined;
    let cursorId: string | undefined;

    if (input.cursor) {
      const decoded = decodeCursor(input.cursor);

      if (!decoded) {
        throw new ValidationError("Invalid cursor", [
          { field: "cursor", message: "Cursor is invalid or expired." },
        ]);
      }

      cursorCreatedAt = new Date(decoded.createdAt);
      cursorId = decoded.id;
    }

    const items = await this.moods.findActiveFeed({
      limit,
      cursorCreatedAt,
      cursorId,
      facultyId: input.facultyId,
      majorId: input.majorId,
      tagSlug: input.tagSlug,
      from: input.from ? new Date(input.from) : undefined,
      to: input.to ? new Date(input.to) : undefined,
      sort: input.sort,
    });

    const pagination = buildNextCursor(
      items.map((item) => ({ id: item.id, createdAt: item.createdAt })),
      limit,
    );

    return {
      items,
      meta: {
        limit,
        nextCursor: pagination.nextCursor,
        hasMore: pagination.hasMore,
      },
    };
  }

  async getFacultyFeed(facultyId: string, input: FeedQueryInput): Promise<FeedResult> {
    const faculty = await this.faculties.findActiveById(facultyId);

    if (!faculty) {
      throw new AppError("Faculty not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    return this.getFeed({ ...input, facultyId: faculty.id });
  }

  async getMajorFeed(majorId: string, input: FeedQueryInput): Promise<FeedResult> {
    const major = await this.faculties.findActiveMajorByIdOnly(majorId);

    if (!major) {
      throw new AppError("Major not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    return this.getFeed({ ...input, majorId: major.id });
  }
}
