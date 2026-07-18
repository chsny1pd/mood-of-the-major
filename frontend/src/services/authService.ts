import { apiClient } from "./apiClient";
import { setAccessToken } from "../utils/token";

export interface AuthUser {
  id: string;
  email: string;
  studentId: string | null;
  yearOfStudy: number | null;
  role: "student" | "administrator" | "advisor";
  facultyId: string | null;
  majorId: string | null;
  displayName: string | null;
  realName: string | null;
  birthYear: number | null;
  avatarUrl: string | null;
}

export interface UserProfile extends AuthUser {
  faculty: { id: string; name: string; slug: string } | null;
  major: { id: string; name: string; slug: string } | null;
  createdAt: string;
}

export type UpdateProfileInput = {
  displayName?: string | null;
  realName?: string | null;
  birthYear?: number | null;
  avatarUrl?: string | null;
  facultyId?: string | null;
  majorId?: string | null;
};

interface AuthResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
    expiresIn: number;
  };
}

export async function register(input: {
  email: string;
  studentId: string;
  yearOfStudy: number;
  password: string;
  facultyId?: string;
  majorId?: string;
}): Promise<AuthUser> {
  const response = await apiClient.post<{ success: true; data: AuthResponse }>(
    "/auth/register",
    input,
  );

  setAccessToken(response.data.data.tokens.accessToken);
  return response.data.data.user;
}

export async function login(input: { email: string; password: string }): Promise<AuthUser> {
  const response = await apiClient.post<{ success: true; data: AuthResponse }>(
    "/auth/login",
    input,
  );

  setAccessToken(response.data.data.tokens.accessToken);
  return response.data.data.user;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout", {});
  } finally {
    // server clears refresh cookie; client clears access token in AuthContext
  }
}

export async function fetchMe(): Promise<UserProfile> {
  const response = await apiClient.get<{ success: true; data: UserProfile }>("/auth/me");
  return response.data.data;
}

export async function updateMe(input: UpdateProfileInput): Promise<UserProfile> {
  const response = await apiClient.patch<{ success: true; data: UserProfile }>("/auth/me", input);
  return response.data.data;
}

export async function updateMe(input: UpdateProfileInput): Promise<UserProfile> {
  const response = await apiClient.patch<{ success: true; data: UserProfile }>("/auth/me", input);
  return response.data.data;
}
