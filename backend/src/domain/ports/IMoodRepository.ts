import type { CreateMoodInput, Mood } from "../entities/Mood.js";

export interface MoodFeedFilters {
  facultyId?: string;
  majorId?: string;
  /** When set, returns moods in that group. When omitted, excludes group-scoped moods. */
  groupId?: string;
  tagSlug?: string;
  from?: Date;
  to?: Date;
  sort?: "newest" | "most_reacted" | "most_commented";
}

export interface MoodFeedQuery extends MoodFeedFilters {
  limit: number;
  cursorCreatedAt?: Date;
  cursorId?: string;
  cursorReactionCount?: number;
  cursorCommentCount?: number;
}

export interface MoodWithRelations extends Mood {
  faculty: { id: string; name: string; nameTh: string | null; slug: string } | null;
  major: { id: string; name: string; nameTh: string | null; slug: string } | null;
  tagDetails: Array<{
    id: string;
    slug: string;
    name: string;
    nameTh: string | null;
    iconKey: string | null;
    isPrimary: boolean;
  }>;
  images: Array<{ id: string; sortOrder: number }>;
  repostOf: { id: string; content: string } | null;
}

export interface MoodSearchQuery extends MoodFeedFilters {
  q: string;
  limit: number;
  cursorCreatedAt?: Date;
  cursorId?: string;
}

export interface AdminMoodListQuery {
  status?: Mood["status"];
  minReportCount?: number;
  limit: number;
  cursorCreatedAt?: Date;
  cursorId?: string;
}

export interface UpdateMoodInput {
  content: string;
  tagIds: string[];
  primaryTagId: string;
}

export interface IMoodRepository {
  create(input: CreateMoodInput): Promise<MoodWithRelations>;
  updateActive(moodId: string, input: UpdateMoodInput): Promise<MoodWithRelations | null>;
  findById(id: string): Promise<MoodWithRelations | null>;
  findByIdIncludingRemoved(id: string): Promise<MoodWithRelations | null>;
  findActiveFeed(query: MoodFeedQuery): Promise<MoodWithRelations[]>;
  search(query: MoodSearchQuery): Promise<MoodWithRelations[]>;
  softDeleteByAuthor(moodId: string, authorId: string): Promise<boolean>;
  isAuthor(moodId: string, authorId: string): Promise<boolean>;
  incrementCommentCount(moodId: string): Promise<void>;
  decrementCommentCount(moodId: string): Promise<void>;
  adjustReactionSummary(moodId: string, emoji: string, delta: number): Promise<Record<string, number>>;
  incrementReportCount(moodId: string): Promise<void>;
  isActive(moodId: string): Promise<boolean>;
  moderateRemove(moodId: string, adminId: string, moderationNote: string | null): Promise<MoodWithRelations | null>;
  findAdminContentList(query: AdminMoodListQuery): Promise<MoodWithRelations[]>;
  countCreatedSince(since: Date): Promise<number>;
  countActive(): Promise<number>;
  findExistingRepost(authorId: string, repostOfMoodId: string): Promise<Mood | null>;
  createRepost(input: {
    authorId: string;
    repostOfMoodId: string;
    content: string;
    facultyId: string | null;
    majorId: string | null;
    tagIds: string[];
    primaryTagId: string;
  }): Promise<MoodWithRelations>;
  incrementRepostCount(moodId: string): Promise<void>;
  hasUserReposted(authorId: string, repostOfMoodId: string): Promise<boolean>;
}
