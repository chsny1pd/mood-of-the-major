import { apiClient } from "./apiClient";
import { setAccessToken } from "../utils/token";

export interface AuthUser {
  id: string;
  email: string;
  role: "student" | "administrator" | "advisor";
  facultyId: string | null;
  majorId: string | null;
}

export interface UserProfile extends AuthUser {
  faculty: { id: string; name: string; slug: string } | null;
  major: { id: string; name: string; slug: string } | null;
  createdAt: string;
}

interface AuthResponse {
  user: AuthUser;
  tokens: {
    accessToken: string;
    expiresIn: number;
  };
}

export async function register(input: {
  email: string;
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
