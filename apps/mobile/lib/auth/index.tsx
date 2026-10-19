/**
 * Auth state machine for the mobile app.
 *
 * States:
 *   - "loading"   → boot-time hydration: read the persisted token from
 *                   AsyncStorage and try to verify it via /auth/me.
 *   - "anonymous" → no valid session. Renders the (auth) route group.
 *   - "authed"    → user + token available. Renders the (tabs) route group.
 *
 * The provider exposes `signup`, `login`, `logout`, and `refresh` actions.
 * Anything that needs to call /match grabs the token via `useAuth()`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import {
  ApiError,
  getMe,
  postLogin,
  postSignup,
  type LoginRequest,
  type SignupRequest,
  type User,
} from "@/lib/api";
import { clearToken, loadToken, saveToken } from "./storage";

export type AuthStatus = "loading" | "anonymous" | "authed";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  token: string | null;
  signup: (body: SignupRequest) => Promise<void>;
  login: (body: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: ProviderProps) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Boot-time hydration: load persisted token, verify, hydrate user.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadToken();
      if (!stored) {
        if (!cancelled) setStatus("anonymous");
        return;
      }
      try {
        const me = await getMe(stored);
        if (cancelled) return;
        setUser(me);
        setToken(stored);
        setStatus("authed");
      } catch (err) {
        // 401 / network error → drop the token and start over.
        if (err instanceof ApiError && err.status === 401) {
          await clearToken();
        }
        if (!cancelled) {
          setUser(null);
          setToken(null);
          setStatus("anonymous");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signup = useCallback(async (body: SignupRequest) => {
    const res = await postSignup(body);
    await saveToken(res.token);
    setUser(res.user);
    setToken(res.token);
    setStatus("authed");
  }, []);

  const login = useCallback(async (body: LoginRequest) => {
    const res = await postLogin(body);
    await saveToken(res.token);
    setUser(res.user);
    setToken(res.token);
    setStatus("authed");
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
    setToken(null);
    setStatus("anonymous");
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const me = await getMe(token);
      setUser(me);
    } catch {
      // ignore — keep the existing user
    }
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, token, signup, login, logout, refresh }),
    [status, user, token, signup, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be called inside <AuthProvider>");
  }
  return ctx;
}
