export const MOOD_CONTENT_MIN_LENGTH = 1;
export const MOOD_CONTENT_MAX_LENGTH = 5000;
export const MAX_IMAGES_PER_MOOD = 4;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export const FEED_DEFAULT_LIMIT = 20;
export const FEED_MAX_LIMIT = 50;
export const GUEST_FEED_MAX_LIMIT = 10;

export const PRESIGNED_UPLOAD_TTL_SECONDS = 15 * 60;
export const SIGNED_DOWNLOAD_TTL_SECONDS = 60 * 60;
