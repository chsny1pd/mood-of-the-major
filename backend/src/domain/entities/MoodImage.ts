export type MoodImageStatus = "pending" | "confirmed" | "orphaned" | "deleted";

export interface MoodImage {
  id: string;
  uploadedBy: string;
  moodId: string | null;
  objectKey: string;
  originalFileName: string | null;
  mimeType: string;
  fileSizeBytes: number;
  status: MoodImageStatus;
  sortOrder: number;
  width: number | null;
  height: number | null;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreateMoodImageInput {
  uploadedBy: string;
  objectKey: string;
  originalFileName: string | null;
  mimeType: string;
  fileSizeBytes: number;
}
