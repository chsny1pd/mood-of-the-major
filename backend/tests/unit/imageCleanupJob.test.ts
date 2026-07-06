import { describe, expect, it, vi } from "vitest";
import { ImageCleanupJob } from "../../src/application/services/ImageCleanupJob.js";
import type { MoodImage } from "../../src/domain/entities/MoodImage.js";
import type { IMoodImageRepository } from "../../src/domain/ports/IMoodImageRepository.js";
import type { IImageStorage } from "../../src/domain/ports/IImageStorage.js";
import { createLogger } from "../../src/infrastructure/logging/logger.js";

function createImage(overrides: Partial<MoodImage> = {}): MoodImage {
  return {
    id: "img-1",
    uploadedBy: "user-1",
    moodId: null,
    objectKey: "development/moods/user-1/test.jpg",
    originalFileName: "test.jpg",
    mimeType: "image/jpeg",
    fileSizeBytes: 1024,
    status: "pending",
    sortOrder: 0,
    width: null,
    height: null,
    confirmedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  };
}

describe("ImageCleanupJob", () => {
  it("cleans up stale unlinked images", async () => {
    const image = createImage();
    const images: IMoodImageRepository = {
      createPending: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      confirmUpload: vi.fn(),
      linkToMood: vi.fn(),
      softDelete: vi.fn(),
      softDeleteByMoodId: vi.fn(),
      findUnlinkedOlderThan: vi.fn().mockResolvedValue([image]),
      markOrphaned: vi.fn().mockResolvedValue(true),
      findDeletedNeedingPurge: vi.fn().mockResolvedValue([]),
      hardDelete: vi.fn().mockResolvedValue(true),
    };
    const storage: IImageStorage = {
      generatePresignedUploadUrl: vi.fn(),
      generateSignedDownloadUrl: vi.fn(),
      headObject: vi.fn(),
      deleteObject: vi.fn().mockResolvedValue(undefined),
      putObject: vi.fn(),
    };

    const job = new ImageCleanupJob(images, storage, 24, 100, createLogger("error", "test"));
    const result = await job.run();

    expect(result.orphansProcessed).toBe(1);
    expect(result.deletedPurged).toBe(0);
    expect(images.markOrphaned).toHaveBeenCalledWith("img-1");
    expect(storage.deleteObject).toHaveBeenCalledWith(image.objectKey);
    expect(images.hardDelete).toHaveBeenCalledWith("img-1");
  });

  it("purges soft-deleted images from R2", async () => {
    const deleted = createImage({
      id: "img-2",
      status: "deleted",
      deletedAt: new Date("2026-01-02T00:00:00.000Z"),
      moodId: "mood-1",
    });
    const images: IMoodImageRepository = {
      createPending: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      confirmUpload: vi.fn(),
      linkToMood: vi.fn(),
      softDelete: vi.fn(),
      softDeleteByMoodId: vi.fn(),
      findUnlinkedOlderThan: vi.fn().mockResolvedValue([]),
      markOrphaned: vi.fn(),
      findDeletedNeedingPurge: vi.fn().mockResolvedValue([deleted]),
      hardDelete: vi.fn().mockResolvedValue(true),
    };
    const storage: IImageStorage = {
      generatePresignedUploadUrl: vi.fn(),
      generateSignedDownloadUrl: vi.fn(),
      headObject: vi.fn(),
      deleteObject: vi.fn().mockResolvedValue(undefined),
      putObject: vi.fn(),
    };

    const job = new ImageCleanupJob(images, storage, 24, 100, createLogger("error", "test"));
    const result = await job.run();

    expect(result.deletedPurged).toBe(1);
    expect(storage.deleteObject).toHaveBeenCalledWith(deleted.objectKey);
    expect(images.hardDelete).toHaveBeenCalledWith("img-2");
  });
});
