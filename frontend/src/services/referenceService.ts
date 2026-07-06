import { apiClient } from "./apiClient";

export interface FacultyOption {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  majorCount: number;
}

export interface MajorOption {
  id: string;
  name: string;
  slug: string;
  code: string | null;
}

export async function fetchFaculties(): Promise<FacultyOption[]> {
  const response = await apiClient.get<{ success: true; data: FacultyOption[] }>("/faculties");
  return response.data.data;
}

export async function fetchMajors(facultyId: string): Promise<MajorOption[]> {
  const response = await apiClient.get<{ success: true; data: MajorOption[] }>(
    `/faculties/${facultyId}/majors`,
  );
  return response.data.data;
}
