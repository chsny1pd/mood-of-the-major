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
import * as authService from "../services/authService";
import type { UserProfile } from "../services/authService";
import { clearAccessToken, getAccessToken } from "../utils/token";

function toInitialProfile(user: authService.AuthUser): UserProfile {
  return {
    ...user,
    faculty: null,
    major: null,
    createdAt: new Date().toISOString(),
  };
}

interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
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
  const [isLoading, setIsLoading] = useState(() => Boolean(getAccessToken()));

  const refreshProfile = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }

    const profile = await authService.fetchMe();
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
    const authUser = await authService.login({ email, password });
    flushSync(() => {
      setUser(toInitialProfile(authUser));
    });
    void refreshProfile().catch(() => undefined);
  }, [refreshProfile]);

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      facultyId?: string;
      majorId?: string;
    }) => {
      const authUser = await authService.register(input);
      flushSync(() => {
        setUser(toInitialProfile(authUser));
      });
      void refreshProfile().catch(() => undefined);
    },
    [refreshProfile],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, isLoading, login, register, logout, refreshProfile],
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
