import { apiClient } from "./apiClient";
import type { PresignUploadResponse } from "../types/mood";

export async function requestUploadUrl(input: {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
}): Promise<PresignUploadResponse> {
  const response = await apiClient.post<{ success: true; data: PresignUploadResponse }>(
    "/images/upload-url",
    input,
  );
  return response.data.data;
}

export async function confirmImageUpload(imageId: string): Promise<void> {
  await apiClient.post(`/images/${imageId}/confirm`, {});
}

export async function fetchSignedImageUrl(imageId: string): Promise<string> {
  const response = await apiClient.get<{ success: true; data: { url: string; expiresAt: string } }>(
    `/images/${imageId}/url`,
  );
  return response.data.data.url;
}

export async function uploadFileViaBackendProxy(imageId: string, file: File): Promise<void> {
  await apiClient.put(`/images/${imageId}/data`, file, {
    headers: { "Content-Type": file.type },
  });
}

export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  headers: Record<string, string>,
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(uploadUrl, {
      method: "PUT",
      headers,
      body: file,
    });
  } catch {
    throw new Error(
      "Could not upload to storage. If you are running locally, restart the backend and try again. For production, configure R2 bucket CORS for your frontend origin.",
    );
  }

  if (!response.ok) {
    throw new Error("Failed to upload image to storage.");
  }
}

export async function uploadImageFile(
  presign: PresignUploadResponse,
  file: File,
): Promise<void> {
  if (presign.uploadVia === "proxy") {
    await uploadFileViaBackendProxy(presign.imageId, file);
    return;
  }

  await uploadFileToPresignedUrl(presign.uploadUrl, file, presign.uploadHeaders);
}
