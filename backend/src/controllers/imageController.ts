import type { Response } from "express";
import type { ImageService, PresignUploadInput } from "../application/services/ImageService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AuthenticationError } from "../domain/errors/AppError.js";

export function createImageController(imageService: ImageService) {
  return {
    requestUploadUrl: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const data = await imageService.requestUploadUrl(req.userId, req.body as PresignUploadInput);

      res.status(201).json({
        success: true,
        data,
      });
    }),

    confirmUpload: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const data = await imageService.confirmUpload(req.userId, String(req.params.imageId));

      res.status(200).json({
        success: true,
        data,
      });
    }),

    getSignedUrl: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const data = await imageService.getSignedDownloadUrl(req.userId, String(req.params.imageId));

      res.status(200).json({
        success: true,
        data,
      });
    }),

    uploadBody: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);

      await imageService.uploadPendingImageBytes(
        req.userId,
        String(req.params.imageId),
        body,
        String(req.headers["content-type"] ?? ""),
      );

      res.status(204).send();
    }),

    deleteImage: asyncHandler(async (req, res: Response) => {
      if (!req.userId) {
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }

      const data = await imageService.deleteImage(
        req.userId,
        String(req.params.imageId),
        req.userRole === "administrator",
      );

      res.status(200).json({
        success: true,
        data,
      });
    }),
  };
}
