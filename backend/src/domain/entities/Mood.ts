export type MoodStatus = "active" | "hidden" | "moderated_removed" | "deleted_by_author";

export interface MoodTagLink {
  tagId: string;
  isPrimary: boolean;
}

export interface Mood {
  id: string;
  authorId: string;
  content: string;
  facultyId: string | null;
  majorId: string | null;
  status: MoodStatus;
  commentCount: number;
  reactionSummary: Record<string, number>;
  imageCount: number;
  primaryTagId: string | null;
  reportCount: number;
  lastActivityAt: Date;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  tags: MoodTagLink[];
}

export interface CreateMoodInput {
  authorId: string;
  content: string;
  facultyId: string | null;
  majorId: string | null;
  tagIds: string[];
  primaryTagId: string;
  imageIds: string[];
}
