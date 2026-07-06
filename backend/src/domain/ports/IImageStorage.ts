export interface PresignedUploadResult {
  uploadUrl: string;
  uploadMethod: "PUT";
  uploadHeaders: Record<string, string>;
  expiresAt: Date;
}

export interface SignedDownloadResult {
  url: string;
  expiresAt: Date;
}

export interface HeadObjectResult {
  exists: boolean;
  contentLength?: number;
  contentType?: string;
}

export interface IImageStorage {
  generatePresignedUploadUrl(
    objectKey: string,
    mimeType: string,
    fileSizeBytes: number,
  ): Promise<PresignedUploadResult>;

  generateSignedDownloadUrl(objectKey: string): Promise<SignedDownloadResult>;

  headObject(objectKey: string): Promise<HeadObjectResult>;

  deleteObject(objectKey: string): Promise<void>;

  putObject(objectKey: string, body: Buffer, mimeType: string): Promise<void>;
}
