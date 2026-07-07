import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import type { AuthUser, UserProfile } from "../services/authService";
import { getOAuthStartUrl, parseOAuthCallbackHash } from "../lib/oauth";
import { ROUTES } from "../constants/routes";
import { clearAccessToken, getAccessToken, setAccessToken } from "../utils/token";

export interface ProfileMeta {
  displayName: string | null;
  avatarUrl: string | null;
}

const defaultProfileMeta: ProfileMeta = {
  displayName: null,
  avatarUrl: null,
};

function toInitialProfile(user: AuthUser): UserProfile {
  return {
    ...user,
    faculty: null,
    major: null,
    createdAt: new Date().toISOString(),
  };
}

interface AuthContextValue {
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

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileMeta, setProfileMeta] = useState<ProfileMeta>(defaultProfileMeta);
  const [isLoading, setIsLoading] = useState(() => Boolean(getAccessToken()));

  const refreshProfile = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }

    const { fetchMe } = await import("../services/authService");
    const profile = await fetchMe();
    setUser(profile);
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      return;
    }

    void (async () => {
      try {
        await refreshProfile();
      } catch {
        clearAccessToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { login: loginRequest } = await import("../services/authService");
    const authUser = await loginRequest({ email, password });
    flushSync(() => {
      setUser(toInitialProfile(authUser));
      setProfileMeta(defaultProfileMeta);
    });
    void refreshProfile().catch(() => undefined);
  }, [refreshProfile]);

  const loginWithOAuth = useCallback((provider: "google" | "github", returnUrl: string = ROUTES.feed) => {
    window.location.assign(getOAuthStartUrl(provider, returnUrl));
  }, []);

  const completeOAuthCallback = useCallback(async () => {
    const { accessToken, displayName, avatarUrl, returnUrl, error } = parseOAuthCallbackHash();

    if (error) {
      throw new Error(error);
    }

    if (!accessToken) {
      throw new Error("Missing access token");
    }

    setAccessToken(accessToken);

    flushSync(() => {
      setProfileMeta({
        displayName,
        avatarUrl,
      });
    });

    await refreshProfile();
    window.history.replaceState(null, "", window.location.pathname);

    return returnUrl;
  }, [refreshProfile]);

  const register = useCallback(
    async (input: {
      email: string;
      studentId: string;
      yearOfStudy: number;
      password: string;
      facultyId?: string;
      majorId?: string;
    }) => {
      const { register: registerRequest } = await import("../services/authService");
      const authUser = await registerRequest(input);
      flushSync(() => {
        setUser(toInitialProfile(authUser));
        setProfileMeta(defaultProfileMeta);
      });
      void refreshProfile().catch(() => undefined);
    },
    [refreshProfile],
  );

  const logout = useCallback(async () => {
    try {
      const { logout: logoutRequest } = await import("../services/authService");
      await logoutRequest();
    } finally {
      clearAccessToken();
      setUser(null);
      setProfileMeta(defaultProfileMeta);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profileMeta,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      loginWithOAuth,
      completeOAuthCallback,
      register,
      logout,
      refreshProfile,
    }),
    [
      user,
      profileMeta,
      isLoading,
      login,
      loginWithOAuth,
      completeOAuthCallback,
      register,
      logout,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
