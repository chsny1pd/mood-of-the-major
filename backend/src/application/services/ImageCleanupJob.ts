import type { IMoodImageRepository } from "../../domain/ports/IMoodImageRepository.js";
import type { IImageStorage } from "../../domain/ports/IImageStorage.js";
import type { Logger } from "../../infrastructure/logging/logger.js";

export interface ImageCleanupResult {
  orphansProcessed: number;
  orphansFailed: number;
  deletedPurged: number;
  deletedFailed: number;
  completedAt: string;
}

export class ImageCleanupJob {
  constructor(
    private readonly images: IMoodImageRepository,
    private readonly storage: IImageStorage,
    private readonly orphanTtlHours: number,
    private readonly batchSize: number,
    private readonly logger: Logger,
  ) {}

  async run(): Promise<ImageCleanupResult> {
    const orphanStats = await this.cleanupOrphans();
    const purgeStats = await this.purgeDeleted();

    return {
      orphansProcessed: orphanStats.processed,
      orphansFailed: orphanStats.failed,
      deletedPurged: purgeStats.processed,
      deletedFailed: purgeStats.failed,
      completedAt: new Date().toISOString(),
    };
  }

  private async cleanupOrphans(): Promise<{ processed: number; failed: number }> {
    const cutoff = new Date(Date.now() - this.orphanTtlHours * 60 * 60 * 1000);
    const candidates = await this.images.findUnlinkedOlderThan(cutoff, this.batchSize);

    let processed = 0;
    let failed = 0;

    for (const image of candidates) {
      try {
        const marked = await this.images.markOrphaned(image.id);
        if (!marked) {
          continue;
        }

        await this.storage.deleteObject(image.objectKey);
        await this.images.hardDelete(image.id);
        processed += 1;
      } catch (error) {
        failed += 1;
        this.logger.error("Orphan image cleanup failed", {
          imageId: image.id,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { processed, failed };
  }

  private async purgeDeleted(): Promise<{ processed: number; failed: number }> {
    const candidates = await this.images.findDeletedNeedingPurge(this.batchSize);

    let processed = 0;
    let failed = 0;

    for (const image of candidates) {
      try {
        await this.storage.deleteObject(image.objectKey);
        await this.images.hardDelete(image.id);
        processed += 1;
      } catch (error) {
        failed += 1;
        this.logger.error("Deleted image R2 purge failed", {
          imageId: image.id,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { processed, failed };
  }
}
