import type { CreateMoodImageInput, MoodImage } from "../entities/MoodImage.js";

export interface IMoodImageRepository {
  createPending(input: CreateMoodImageInput): Promise<MoodImage>;
  findById(id: string): Promise<MoodImage | null>;
  findByIds(ids: string[]): Promise<MoodImage[]>;
  confirmUpload(id: string, uploadedBy: string): Promise<MoodImage | null>;
  linkToMood(imageIds: string[], moodId: string, uploadedBy: string): Promise<void>;
  softDelete(id: string, uploadedBy: string): Promise<boolean>;
  softDeleteByMoodId(moodId: string): Promise<void>;
}
