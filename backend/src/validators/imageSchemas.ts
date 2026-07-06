import { z } from "zod";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "../domain/constants/moodConstants.js";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

export const presignUploadSchema = z
  .object({
    fileName: z.string().trim().min(1, "File name is required.").max(255),
    mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
      message: "Only JPEG, PNG, and WebP images are allowed.",
    }),
    fileSizeBytes: z.coerce
      .number()
      .int()
      .positive()
      .max(MAX_IMAGE_SIZE_BYTES, "Maximum file size is 5 MB."),
  })
  .strict();

export const imageIdParamSchema = z.object({
  imageId: objectIdSchema,
});
