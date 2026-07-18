import { apiClient } from "./apiClient";

export type SubmissionType = "faculty" | "major" | "tag";

export interface SubmitFacultyPayload {
  name: string;
  nameTh?: string | null;
}

export interface SubmitMajorPayload {
  name: string;
  nameTh?: string | null;
}

export interface SubmitTagPayload {
  name: string;
  nameTh?: string | null;
  iconKey?: string | null;
}

export interface SubmissionResult {
  id: string;
  type: SubmissionType;
  name: string;
  nameTh: string | null;
  slug: string;
  approvalStatus: string;
  createdAt: string;
}

export async function submitFaculty(payload: SubmitFacultyPayload): Promise<SubmissionResult> {
  const response = await apiClient.post<{ success: true; data: SubmissionResult }>(
    "/faculties/submissions",
    payload,
  );
  return response.data.data;
}

export async function submitMajor(
  facultyId: string,
  payload: SubmitMajorPayload,
): Promise<SubmissionResult> {
  const response = await apiClient.post<{ success: true; data: SubmissionResult }>(
    `/faculties/${facultyId}/majors/submissions`,
    { ...payload, facultyId },
  );
  return response.data.data;
}

export async function submitTag(payload: SubmitTagPayload): Promise<SubmissionResult> {
  const response = await apiClient.post<{ success: true; data: SubmissionResult }>(
    "/tags/submissions",
    payload,
  );
  return response.data.data;
}
