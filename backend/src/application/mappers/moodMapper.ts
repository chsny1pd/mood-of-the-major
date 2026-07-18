import type { MoodWithRelations } from "../../domain/ports/IMoodRepository.js";

const REPOST_EXCERPT_MAX = 120;

function excerpt(text: string): string {
  if (text.length <= REPOST_EXCERPT_MAX) return text;
  return `${text.slice(0, REPOST_EXCERPT_MAX)}…`;
}

export interface AnonymousMoodDto {
  id: string;
  content: string;
  faculty: { id: string; name: string; nameTh: string | null; slug: string } | null;
  major: { id: string; name: string; nameTh: string | null; slug: string } | null;
  tags: Array<{
    id: string;
    slug: string;
    name: string;
    nameTh: string | null;
    iconKey: string | null;
    isPrimary: boolean;
  }>;
  commentCount: number;
  reactionSummary: Record<string, number>;
  imageCount: number;
  images: Array<{ id: string; sortOrder: number }>;
  createdAt: string;
  lastActivityAt: string;
  editedAt: string | null;
  isOwner?: true;
  canEdit?: true;
  isRepost?: true;
  repostOf?: { moodId: string; excerpt: string } | null;
  repostCount?: number;
  hasReposted?: true;
}

export interface AnonymousMoodDtoOptions {
  isOwner?: true;
  canEdit?: true;
  hasReposted?: true;
}

export function toAnonymousMoodDto(
  mood: MoodWithRelations,
  options?: AnonymousMoodDtoOptions,
): AnonymousMoodDto {
  const dto: AnonymousMoodDto = {
    id: mood.id,
    content: mood.content,
    faculty: mood.faculty,
    major: mood.major,
    tags: mood.tagDetails,
    commentCount: mood.commentCount,
    reactionSummary: mood.reactionSummary,
    imageCount: mood.imageCount,
    images: mood.images,
    createdAt: mood.createdAt.toISOString(),
    lastActivityAt: mood.lastActivityAt.toISOString(),
    editedAt: mood.editedAt?.toISOString() ?? null,
    repostCount: mood.repostCount,
  };

  if (mood.repostOfMoodId && mood.repostOf) {
    dto.isRepost = true;
    dto.repostOf = {
      moodId: mood.repostOf.id,
      excerpt: excerpt(mood.repostOf.content),
    };
  }

  if (options?.isOwner) {
    dto.isOwner = true;
  }

  if (options?.canEdit) {
    dto.canEdit = true;
  }

  if (options?.hasReposted) {
    dto.hasReposted = true;
  }

  return dto;
}

export function assertNoIdentityFields(dto: AnonymousMoodDto): void {
  const serialized = JSON.stringify(dto);
  const forbidden = ["authorId", "userId", "email", "uploadedBy"];

  for (const field of forbidden) {
    if (serialized.includes(`"${field}"`)) {
      throw new Error(`Anonymous DTO leaked identity field: ${field}`);
    }
  }
}
