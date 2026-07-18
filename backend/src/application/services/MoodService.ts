import {
  FEED_DEFAULT_LIMIT,
  FEED_MAX_LIMIT,
  GUEST_FEED_MAX_LIMIT,
  MAX_IMAGES_PER_MOOD,
  MOOD_CONTENT_MAX_LENGTH,
  MOOD_CONTENT_MIN_LENGTH,
  MOOD_EDIT_WINDOW_MS,
} from "../../domain/constants/moodConstants.js";
import { SEARCH_QUERY_MIN_LENGTH } from "../../domain/constants/engagementConstants.js";
import {
  AppError,
  AuthorizationError,
  ConflictError,
  ValidationError,
} from "../../domain/errors/AppError.js";
import type { IFacultyRepository } from "../../domain/ports/IFacultyRepository.js";
import type { IGroupMemberRepository } from "../../domain/ports/IGroupRepository.js";
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
  groupId?: string;
  tagIds: string[];
  primaryTagId: string;
  imageIds?: string[];
}

export interface UpdateMoodServiceInput {
  content: string;
  tagIds: string[];
  primaryTagId: string;
}

export interface FeedQueryInput extends Omit<MoodFeedFilters, "from" | "to"> {
  limit?: number;
  cursor?: string;
  isAuthenticated?: boolean;
  from?: string;
  to?: string;
}

export interface SearchQueryInput {
  q: string;
  facultyId?: string;
  majorId?: string;
  tagSlug?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
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
    private readonly groupMembers: IGroupMemberRepository,
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

    let groupId: string | null = null;
    if (input.groupId) {
      const membership = await this.groupMembers.findMembership(input.groupId, userId);
      if (!membership) {
        throw new AuthorizationError("Join this group to post", "GROUP_MEMBERSHIP_REQUIRED");
      }
      groupId = input.groupId;
    }

    const mood = await this.moods.create({
      authorId: userId,
      content,
      facultyId: facultyId ?? null,
      majorId: majorId ?? null,
      groupId,
      tagIds: input.tagIds,
      primaryTagId: input.primaryTagId,
      imageIds,
    });

    if (imageIds.length > 0) {
      await this.moodImages.linkToMood(imageIds, mood.id, userId);
      return this.getMood(mood.id);
    }

    return mood;
  }

  async getMood(moodId: string, viewerUserId?: string): Promise<MoodWithRelations> {
    const mood = await this.moods.findById(moodId);

    if (!mood) {
      throw new AppError("Mood not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    if (mood.groupId) {
      if (!viewerUserId) {
        throw new AuthorizationError("Join this group to view posts", "GROUP_MEMBERSHIP_REQUIRED");
      }
      const membership = await this.groupMembers.findMembership(mood.groupId, viewerUserId);
      if (!membership) {
        throw new AuthorizationError("Join this group to view posts", "GROUP_MEMBERSHIP_REQUIRED");
      }
    }

    return mood;
  }

  getViewerFlags(
    mood: MoodWithRelations,
    userId: string | undefined,
    isAdmin = false,
  ): { isOwner?: true; canEdit?: true } {
    if (!userId) {
      return {};
    }

    if (mood.authorId !== userId && !isAdmin) {
      return {};
    }

    const withinEditWindow =
      isAdmin || Date.now() <= mood.createdAt.getTime() + MOOD_EDIT_WINDOW_MS;

    return {
      isOwner: mood.authorId === userId ? true : undefined,
      canEdit: withinEditWindow ? true : undefined,
    };
  }

  private validateMoodContentAndTags(input: {
    content: string;
    tagIds: string[];
    primaryTagId: string;
  }): string {
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

    return content;
  }

  private async assertActiveTags(tagIds: string[]): Promise<void> {
    const activeTags = await this.tags.findActiveByIds(tagIds);

    if (activeTags.length !== tagIds.length) {
      throw new ValidationError("Invalid tags", [
        { field: "tagIds", message: "One or more tags are invalid or inactive." },
      ]);
    }
  }

  async updateMood(
    userId: string,
    moodId: string,
    input: UpdateMoodServiceInput,
    isAdmin = false,
  ): Promise<MoodWithRelations> {
    const mood = await this.moods.findById(moodId);

    if (!mood) {
      throw new AppError("Mood not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    if (!isAdmin) {
      const isOwner = await this.moods.isAuthor(moodId, userId);

      if (!isOwner) {
        throw new AuthorizationError("You can only edit your own moods", "NOT_OWNER");
      }

      if (Date.now() > mood.createdAt.getTime() + MOOD_EDIT_WINDOW_MS) {
        throw new AuthorizationError("Edit window has expired", "EDIT_WINDOW_EXPIRED");
      }
    }

    const content = this.validateMoodContentAndTags(input);
    await this.assertActiveTags(input.tagIds);

    const updated = await this.moods.updateActive(moodId, {
      content,
      tagIds: input.tagIds,
      primaryTagId: input.primaryTagId,
    });

    if (!updated) {
      throw new AppError("Mood not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    return updated;
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
    const sort = input.sort ?? "newest";

    let cursorCreatedAt: Date | undefined;
    let cursorId: string | undefined;
    let cursorReactionCount: number | undefined;
    let cursorCommentCount: number | undefined;

    if (input.cursor) {
      const decoded = decodeCursor(input.cursor);

      if (!decoded) {
        throw new ValidationError("Invalid cursor", [
          { field: "cursor", message: "Cursor is invalid or expired." },
        ]);
      }

      if (sort === "most_reacted" && typeof decoded.reactionCount !== "number") {
        throw new ValidationError("Invalid cursor", [
          { field: "cursor", message: "Cursor is invalid or expired." },
        ]);
      }

      if (sort === "most_commented" && typeof decoded.commentCount !== "number") {
        throw new ValidationError("Invalid cursor", [
          { field: "cursor", message: "Cursor is invalid or expired." },
        ]);
      }

      cursorCreatedAt = new Date(decoded.createdAt);
      cursorId = decoded.id;
      cursorReactionCount = decoded.reactionCount;
      cursorCommentCount = decoded.commentCount;
    }

    const items = await this.moods.findActiveFeed({
      limit,
      cursorCreatedAt,
      cursorId,
      cursorReactionCount,
      cursorCommentCount,
      facultyId: input.facultyId,
      majorId: input.majorId,
      tagSlug: input.tagSlug,
      from: input.from ? new Date(input.from) : undefined,
      to: input.to ? new Date(input.to) : undefined,
      sort,
    });

    const pagination = buildNextCursor(
      items.map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        reactionCount: item.reactionCount,
        commentCount: item.commentCount,
      })),
      limit,
      sort,
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

  async getGroupFeed(
    groupId: string,
    input: { limit?: number; cursor?: string },
  ): Promise<FeedResult> {
    const maxLimit = FEED_MAX_LIMIT;
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
      groupId,
      sort: "newest",
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

  async searchMoods(input: SearchQueryInput): Promise<FeedResult> {
    const q = input.q.trim();
    if (q.length < SEARCH_QUERY_MIN_LENGTH) {
      throw new ValidationError("Invalid search query", [
        {
          field: "q",
          message: `Search query must be at least ${SEARCH_QUERY_MIN_LENGTH} characters.`,
        },
      ]);
    }

    const limit = Math.min(Math.max(input.limit ?? FEED_DEFAULT_LIMIT, 1), FEED_MAX_LIMIT);

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

    const items = await this.moods.search({
      q,
      limit,
      cursorCreatedAt,
      cursorId,
      facultyId: input.facultyId,
      majorId: input.majorId,
      tagSlug: input.tagSlug,
      from: input.from ? new Date(input.from) : undefined,
      to: input.to ? new Date(input.to) : undefined,
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

  async repostMood(userId: string, moodId: string): Promise<MoodWithRelations> {
    const original = await this.moods.findById(moodId);

    if (!original) {
      throw new AppError("Mood not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    if (original.repostOfMoodId) {
      throw new ValidationError("Cannot repost a repost", [
        { field: "moodId", message: "Only original posts can be reposted." },
      ]);
    }

    if (await this.moods.hasUserReposted(userId, moodId)) {
      throw new ConflictError("You have already reposted this mood", "DUPLICATE_REPOST");
    }

    const tagIds = original.tags.map((tag) => tag.tagId);
    const primaryTagId = original.primaryTagId ?? tagIds[0];

    if (!primaryTagId || tagIds.length === 0) {
      throw new ValidationError("Invalid mood tags", [
        { field: "moodId", message: "Original mood has no tags." },
      ]);
    }

    return this.moods.createRepost({
      authorId: userId,
      repostOfMoodId: moodId,
      content: original.content,
      facultyId: original.facultyId,
      majorId: original.majorId,
      tagIds,
      primaryTagId,
    });
  }

  async hasUserReposted(userId: string, moodId: string): Promise<boolean> {
    return this.moods.hasUserReposted(userId, moodId);
  }
}
