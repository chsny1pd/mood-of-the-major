import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "../../domain/constants/moodConstants.js";
import {
  AppError,
  AuthorizationError,
  ValidationError,
} from "../../domain/errors/AppError.js";
import type { IImageStorage } from "../../domain/ports/IImageStorage.js";
import type { IMoodImageRepository } from "../../domain/ports/IMoodImageRepository.js";
import { buildObjectKey } from "../../infrastructure/storage/R2ImageStorage.js";
import type { Env } from "../../config/env.js";

export interface PresignUploadInput {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
}

export class ImageService {
  constructor(
    private readonly images: IMoodImageRepository,
    private readonly storage: IImageStorage,
    private readonly env: Env,
  ) {}

  async requestUploadUrl(userId: string, input: PresignUploadInput) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(input.mimeType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      throw new ValidationError("Invalid file type", [
        { field: "mimeType", message: "Only JPEG, PNG, and WebP images are allowed." },
      ]);
    }

    if (input.fileSizeBytes > MAX_IMAGE_SIZE_BYTES) {
      throw new AppError("File too large", {
        statusCode: 422,
        code: "FILE_TOO_LARGE",
        details: [{ field: "fileSizeBytes", message: "Maximum file size is 5 MB." }],
      });
    }

    const objectKey = buildObjectKey(this.env.NODE_ENV, userId, input.fileName);
    const pending = await this.images.createPending({
      uploadedBy: userId,
      objectKey,
      originalFileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
    });

    const presigned = await this.storage.generatePresignedUploadUrl(
      objectKey,
      input.mimeType,
      input.fileSizeBytes,
    );

    const useUploadProxy = this.env.NODE_ENV === "development" || this.env.NODE_ENV === "test";

    return {
      imageId: pending.id,
      uploadUrl: presigned.uploadUrl,
      uploadMethod: presigned.uploadMethod,
      uploadHeaders: presigned.uploadHeaders,
      expiresAt: presigned.expiresAt.toISOString(),
      objectKey,
      uploadVia: useUploadProxy ? ("proxy" as const) : ("direct" as const),
    };
  }

  async uploadPendingImageBytes(
    userId: string,
    imageId: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    if (this.env.NODE_ENV !== "development" && this.env.NODE_ENV !== "test") {
      throw new AppError("Upload proxy is not available", { statusCode: 404, code: "NOT_FOUND" });
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(contentType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      throw new ValidationError("Invalid file type", [
        { field: "contentType", message: "Only JPEG, PNG, and WebP images are allowed." },
      ]);
    }

    if (body.byteLength > MAX_IMAGE_SIZE_BYTES) {
      throw new AppError("File too large", {
        statusCode: 422,
        code: "FILE_TOO_LARGE",
      });
    }

    const image = await this.images.findById(imageId);

    if (!image || image.uploadedBy !== userId || image.status !== "pending" || image.deletedAt) {
      throw new AppError("Image not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    if (image.mimeType !== contentType) {
      throw new ValidationError("Content type mismatch", [
        { field: "contentType", message: "Uploaded content type does not match the presign request." },
      ]);
    }

    await this.storage.putObject(image.objectKey, body, contentType);
  }

  async confirmUpload(userId: string, imageId: string) {
    const image = await this.images.findById(imageId);

    if (!image || image.uploadedBy !== userId) {
      throw new AppError("Image not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    if (image.status !== "pending") {
      throw new ValidationError("Image already confirmed", [
        { field: "imageId", message: "This image has already been processed." },
      ]);
    }

    const head = await this.storage.headObject(image.objectKey);

    if (!head.exists) {
      throw new AppError("Upload not found in storage", {
        statusCode: 422,
        code: "UPLOAD_NOT_FOUND_IN_R2",
      });
    }

    const confirmed = await this.images.confirmUpload(imageId, userId);

    if (!confirmed) {
      throw new AppError("Image not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    return {
      id: confirmed.id,
      status: confirmed.status,
      confirmedAt: confirmed.confirmedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  async getSignedDownloadUrl(userId: string, imageId: string) {
    const image = await this.images.findById(imageId);

    if (!image || image.status !== "confirmed" || image.deletedAt) {
      throw new AppError("Image not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    if (image.uploadedBy !== userId && !image.moodId) {
      throw new AuthorizationError("Cannot access this image", "FORBIDDEN");
    }

    const signed = await this.storage.generateSignedDownloadUrl(image.objectKey);

    return {
      url: signed.url,
      expiresAt: signed.expiresAt.toISOString(),
    };
  }

  async deleteImage(userId: string, imageId: string, isAdmin = false) {
    const image = await this.images.findById(imageId);

    if (!image || image.deletedAt) {
      throw new AppError("Image not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    if (!isAdmin && image.uploadedBy !== userId) {
      throw new AuthorizationError("Cannot delete this image", "FORBIDDEN");
    }

    const deleted = await this.images.softDelete(imageId, image.uploadedBy);

    if (!deleted) {
      throw new AppError("Image not found", { statusCode: 404, code: "NOT_FOUND" });
    }

    void this.storage.deleteObject(image.objectKey).catch(() => undefined);

    return { message: "Image deleted." };
  }
}
