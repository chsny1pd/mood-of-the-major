import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Env } from "../../config/env.js";
import {
  PRESIGNED_UPLOAD_TTL_SECONDS,
  SIGNED_DOWNLOAD_TTL_SECONDS,
} from "../../domain/constants/moodConstants.js";
import type {
  HeadObjectResult,
  IImageStorage,
  PresignedUploadResult,
  SignedDownloadResult,
} from "../../domain/ports/IImageStorage.js";

export function buildObjectKey(
  environment: string,
  userId: string,
  fileName: string,
): string {
  const ext = extname(fileName).toLowerCase() || ".jpg";
  const safeExt = ext.startsWith(".") ? ext.slice(1) : ext;

  return `${environment}/moods/${userId}/${Date.now()}-${randomUUID()}.${safeExt}`;
}

export class R2ImageStorage implements IImageStorage {
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor(env: Env) {
    if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME) {
      throw new Error("R2 credentials are required for R2ImageStorage");
    }

    this.bucketName = env.R2_BUCKET_NAME;
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  async generatePresignedUploadUrl(
    objectKey: string,
    mimeType: string,
    _fileSizeBytes: number,
  ): Promise<PresignedUploadResult> {
    const expiresAt = new Date(Date.now() + PRESIGNED_UPLOAD_TTL_SECONDS * 1000);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: PRESIGNED_UPLOAD_TTL_SECONDS,
    });

    return {
      uploadUrl,
      uploadMethod: "PUT",
      uploadHeaders: { "Content-Type": mimeType },
      expiresAt,
    };
  }

  async generateSignedDownloadUrl(objectKey: string): Promise<SignedDownloadResult> {
    const expiresAt = new Date(Date.now() + SIGNED_DOWNLOAD_TTL_SECONDS * 1000);

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: SIGNED_DOWNLOAD_TTL_SECONDS,
    });

    return { url, expiresAt };
  }

  async headObject(objectKey: string): Promise<HeadObjectResult> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
        }),
      );

      return {
        exists: true,
        contentLength: response.ContentLength,
        contentType: response.ContentType,
      };
    } catch {
      return { exists: false };
    }
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      }),
    );
  }

  async putObject(objectKey: string, body: Buffer, mimeType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        Body: body,
        ContentType: mimeType,
      }),
    );
  }
}

/**
 * Development/test storage when R2 credentials are not configured.
 * Presigned URLs point to a placeholder; headObject always succeeds after confirm.
 */
export class DevImageStorage implements IImageStorage {
  async generatePresignedUploadUrl(
    objectKey: string,
    mimeType: string,
    _fileSizeBytes: number,
  ): Promise<PresignedUploadResult> {
    const expiresAt = new Date(Date.now() + PRESIGNED_UPLOAD_TTL_SECONDS * 1000);

    return {
      uploadUrl: `https://dev-upload.local/${encodeURIComponent(objectKey)}`,
      uploadMethod: "PUT",
      uploadHeaders: { "Content-Type": mimeType },
      expiresAt,
    };
  }

  async generateSignedDownloadUrl(objectKey: string): Promise<SignedDownloadResult> {
    const expiresAt = new Date(Date.now() + SIGNED_DOWNLOAD_TTL_SECONDS * 1000);

    return {
      url: `https://dev-download.local/${encodeURIComponent(objectKey)}`,
      expiresAt,
    };
  }

  async headObject(_objectKey: string): Promise<HeadObjectResult> {
    return { exists: true, contentLength: 1024, contentType: "image/jpeg" };
  }

  async deleteObject(_objectKey: string): Promise<void> {
    // no-op in dev
  }

  async putObject(_objectKey: string, _body: Buffer, _mimeType: string): Promise<void> {
    // no-op in dev
  }
}

export function createImageStorage(env: Env): IImageStorage {
  const hasR2 =
    env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET_NAME;

  if (hasR2) {
    return new R2ImageStorage(env);
  }

  if (env.NODE_ENV === "production") {
    throw new Error("R2 credentials are required in production");
  }

  return new DevImageStorage();
}
