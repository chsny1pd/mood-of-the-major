import type { MoodWithRelations } from "../../domain/ports/IMoodRepository.js";

export interface AnonymousMoodDto {
  id: string;
  content: string;
  faculty: { id: string; name: string; slug: string } | null;
  major: { id: string; name: string; slug: string } | null;
  tags: Array<{ id: string; slug: string; name: string; isPrimary: boolean }>;
  commentCount: number;
  reactionSummary: Record<string, number>;
  imageCount: number;
  images: Array<{ id: string; sortOrder: number }>;
  createdAt: string;
  lastActivityAt: string;
  editedAt: string | null;
  isOwner?: true;
  canEdit?: true;
}

export interface AnonymousMoodDtoOptions {
  isOwner?: true;
  canEdit?: true;
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
  };

  if (options?.isOwner) {
    dto.isOwner = true;
  }

  if (options?.canEdit) {
    dto.canEdit = true;
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
