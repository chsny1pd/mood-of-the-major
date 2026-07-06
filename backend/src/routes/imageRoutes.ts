import express, { Router } from "express";
import type { Dependencies } from "../config/di.js";
import { MAX_IMAGE_SIZE_BYTES } from "../domain/constants/moodConstants.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { presignUploadSchema } from "../validators/imageSchemas.js";

export function createImageRoutes(deps: Dependencies): Router {
  const router = Router();
  const { imageController, authenticate, env, rateLimiters } = deps;

  router.post(
    "/upload-url",
    authenticate,
    authorize("student"),
    rateLimiters.imageUpload,
    validate(presignUploadSchema),
    imageController.requestUploadUrl,
  );

  if (env.NODE_ENV === "development" || env.NODE_ENV === "test") {
    router.put(
      "/:imageId/data",
      authenticate,
      authorize("student"),
      express.raw({
        type: ["image/jpeg", "image/png", "image/webp"],
        limit: MAX_IMAGE_SIZE_BYTES,
      }),
      imageController.uploadBody,
    );
  }

  router.post("/:imageId/confirm", authenticate, authorize("student"), imageController.confirmUpload);
  router.get("/:imageId/url", authenticate, imageController.getSignedUrl);
  router.delete("/:imageId", authenticate, authorize("student", "administrator"), imageController.deleteImage);

  return router;
}
