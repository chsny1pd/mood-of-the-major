import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import { getOAuthStartUrl, parseOAuthCallbackHash } from "../lib/oauth";
import { ROUTES } from "../constants/routes";
import { clearAccessToken, getAccessToken, setAccessToken } from "../utils/token";
import type { UserProfile } from "../services/authService";
import {
  AuthContext,
  defaultProfileMeta,
  toInitialProfile,
  type AuthContextValue,
  type ProfileMeta,
} from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [oauthMeta, setOauthMeta] = useState<ProfileMeta>(defaultProfileMeta);
  const [isLoading, setIsLoading] = useState(() => Boolean(getAccessToken()));

  // Once the full profile has loaded from /me, it is the source of truth for
  // displayName/avatarUrl. The OAuth callback hash values are only a
  // transient fallback shown before that first refresh completes.
  const profileMeta = useMemo<ProfileMeta>(
    () => ({
      displayName: user?.displayName ?? oauthMeta.displayName,
      avatarUrl: user?.avatarUrl ?? oauthMeta.avatarUrl,
    }),
    [user, oauthMeta],
  );

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
      setOauthMeta(defaultProfileMeta);
    });
    void refreshProfile().catch(() => undefined);
  }, [refreshProfile]);

  const loginWithOAuth = useCallback((provider: "google" | "github", returnUrl: string = ROUTES.dashboard) => {
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
      setOauthMeta({
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
        setOauthMeta(defaultProfileMeta);
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
      setOauthMeta(defaultProfileMeta);
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
