// contexts/AuthContext.tsx
// Global auth state — role, tokens, login/logout. Wraps entire app.
"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { login as apiLogin, logout as apiLogout } from "@/services/auth";
import { getStoredTokens, clearTokens } from "@/services/apiClient";
import type { AuthUser } from "@/types";

interface AuthContextValue {
  user:      AuthUser | null;
  loading:   boolean;
  login:     (username: string, password: string) => Promise<void>;
  logout:    () => void;
  isAdmin:   boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from stored tokens on page refresh
  useEffect(() => {
    const tokens = getStoredTokens();
    if (tokens?.access) {
      try {
        // Decode role from JWT payload (no network call needed)
        const payload = JSON.parse(atob(tokens.access.split(".")[1]));
        setUser({ id: payload.user_id, username: payload.username, role: payload.role });
      } catch {
        clearTokens();
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const u = await apiLogin(username, password);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}