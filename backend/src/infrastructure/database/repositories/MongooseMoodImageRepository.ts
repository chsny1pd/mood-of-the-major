import type { CreateMoodImageInput, MoodImage } from "../../../domain/entities/MoodImage.js";
import type { IMoodImageRepository } from "../../../domain/ports/IMoodImageRepository.js";
import { MoodImageModel } from "../models/MoodImage.js";

function toMoodImage(doc: {
  _id: { toString(): string };
  uploadedBy: { toString(): string };
  moodId?: { toString(): string } | null;
  objectKey: string;
  originalFileName?: string | null;
  mimeType: string;
  fileSizeBytes: number;
  status: MoodImage["status"];
  sortOrder: number;
  width?: number | null;
  height?: number | null;
  confirmedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}): MoodImage {
  return {
    id: doc._id.toString(),
    uploadedBy: doc.uploadedBy.toString(),
    moodId: doc.moodId?.toString() ?? null,
    objectKey: doc.objectKey,
    originalFileName: doc.originalFileName ?? null,
    mimeType: doc.mimeType,
    fileSizeBytes: doc.fileSizeBytes,
    status: doc.status,
    sortOrder: doc.sortOrder,
    width: doc.width ?? null,
    height: doc.height ?? null,
    confirmedAt: doc.confirmedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    deletedAt: doc.deletedAt ?? null,
  };
}

export class MongooseMoodImageRepository implements IMoodImageRepository {
  async createPending(input: CreateMoodImageInput): Promise<MoodImage> {
    const doc = await MoodImageModel.create({
      uploadedBy: input.uploadedBy,
      objectKey: input.objectKey,
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      status: "pending",
    });

    return toMoodImage(doc);
  }

  async findById(id: string): Promise<MoodImage | null> {
    const doc = await MoodImageModel.findById(id).lean();
    return doc ? toMoodImage(doc) : null;
  }

  async findByIds(ids: string[]): Promise<MoodImage[]> {
    if (ids.length === 0) return [];

    const docs = await MoodImageModel.find({ _id: { $in: ids } }).lean();
    return docs.map(toMoodImage);
  }

  async confirmUpload(id: string, uploadedBy: string): Promise<MoodImage | null> {
    const doc = await MoodImageModel.findOneAndUpdate(
      { _id: id, uploadedBy, status: "pending", deletedAt: null },
      { status: "confirmed", confirmedAt: new Date() },
      { returnDocument: "after" },
    ).lean();

    return doc ? toMoodImage(doc) : null;
  }

  async linkToMood(imageIds: string[], moodId: string, uploadedBy: string): Promise<void> {
    await Promise.all(
      imageIds.map((imageId, index) =>
        MoodImageModel.updateOne(
          {
            _id: imageId,
            uploadedBy,
            status: "confirmed",
            moodId: null,
            deletedAt: null,
          },
          { moodId, sortOrder: index },
        ),
      ),
    );
  }

  async softDelete(id: string, uploadedBy: string): Promise<boolean> {
    const result = await MoodImageModel.updateOne(
      { _id: id, uploadedBy, deletedAt: null },
      { status: "deleted", deletedAt: new Date() },
    );

    return result.modifiedCount > 0;
  }

  async softDeleteByMoodId(moodId: string): Promise<void> {
    await MoodImageModel.updateMany(
      { moodId, deletedAt: null },
      { status: "deleted", deletedAt: new Date() },
    );
  }
}
