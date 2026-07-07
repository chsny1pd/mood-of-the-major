export interface EmotionTag {
  id: string;
  name: string;
  nameTh: string | null;
  slug: string;
  colorToken: string | null;
  iconKey: string | null;
}

export interface AnonymousMood {
  id: string;
  content: string;
  faculty: { id: string; name: string; nameTh: string | null; slug: string } | null;
  major: { id: string; name: string; nameTh: string | null; slug: string } | null;
  tags: Array<{ id: string; slug: string; name: string; nameTh: string | null; isPrimary: boolean }>;
  commentCount: number;
  reactionSummary: Record<string, number>;
  imageCount: number;
  images: Array<{ id: string; sortOrder: number }>;
  createdAt: string;
  lastActivityAt: string;
  editedAt: string | null;
  isOwner?: boolean;
  canEdit?: boolean;
}

export interface PaginatedMoods {
  data: AnonymousMood[];
  meta: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface CreateMoodPayload {
  content: string;
  facultyId?: string;
  majorId?: string;
  tagIds: string[];
  primaryTagId: string;
  imageIds?: string[];
}

export interface UpdateMoodPayload {
  content: string;
  tagIds: string[];
  primaryTagId: string;
}

export interface PresignUploadResponse {
  imageId: string;
  uploadUrl: string;
  uploadMethod: "PUT";
  uploadHeaders: Record<string, string>;
  expiresAt: string;
  uploadVia?: "direct" | "proxy";
}
