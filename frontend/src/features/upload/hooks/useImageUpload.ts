import { useCallback, useState } from "react";
import {
  confirmImageUpload,
  requestUploadUrl,
  uploadImageFile,
} from "../../../services/imageService";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 4;

export interface UploadedImage {
  id: string;
  previewUrl: string;
  fileName: string;
}

export function useImageUpload() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);

    if (images.length + fileArray.length > MAX_IMAGES) {
      setError(`You can attach up to ${MAX_IMAGES} images.`);
      return;
    }

    setUploading(true);

    try {
      for (const file of fileArray) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          throw new Error("Only JPEG, PNG, and WebP images are allowed.");
        }

        if (file.size > MAX_SIZE_BYTES) {
          throw new Error("Each image must be 5 MB or smaller.");
        }

        const presign = await requestUploadUrl({
          fileName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
        });

        await uploadImageFile(presign, file);
        await confirmImageUpload(presign.imageId);

        setImages((current) => [
          ...current,
          {
            id: presign.imageId,
            previewUrl: URL.createObjectURL(file),
            fileName: file.name,
          },
        ]);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, [images.length]);

  const removeImage = useCallback((imageId: string) => {
    setImages((current) => {
      const target = current.find((image) => image.id === imageId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((image) => image.id !== imageId);
    });
  }, []);

  const reset = useCallback(() => {
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setImages([]);
    setError(null);
  }, [images]);

  return {
    images,
    uploading,
    error,
    uploadFiles,
    removeImage,
    reset,
    imageIds: images.map((image) => image.id),
  };
}
