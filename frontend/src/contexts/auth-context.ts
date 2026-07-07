import { createContext } from "react";
import type { AuthUser, UserProfile } from "../services/authService";

export interface ProfileMeta {
  displayName: string | null;
  avatarUrl: string | null;
}

export const defaultProfileMeta: ProfileMeta = {
  displayName: null,
  avatarUrl: null,
};

export function toInitialProfile(user: AuthUser): UserProfile {
  return {
    ...user,
    faculty: null,
    major: null,
    createdAt: new Date().toISOString(),
  };
}

export interface AuthContextValue {
  user: UserProfile | null;
  profileMeta: ProfileMeta;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: "google" | "github", returnUrl?: string) => void;
  completeOAuthCallback: () => Promise<string>;
  register: (input: {
    email: string;
    studentId: string;
    yearOfStudy: number;
    password: string;
    facultyId?: string;
    majorId?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
