// services/apiClient.ts
// Base Axios instance — attaches Bearer token to every request,
// handles 401 refresh flow, and maps backend errors to ApiError type (design p.21)

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiError, AuthTokens } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ── Request interceptor: attach JWT access token ──────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokens = getStoredTokens();
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

// ── Response interceptor: auto-refresh on 401 ─────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const tokens = getStoredTokens();

      if (tokens?.refresh) {
        try {
          const { data } = await axios.post<{ access: string }>(
            `${BASE_URL}/api/auth/token/refresh/`,
            { refresh: tokens.refresh }
          );
          storeTokens({ ...tokens, access: data.access });
          original.headers.Authorization = `Bearer ${data.access}`;
          return apiClient(original);
        } catch {
          clearTokens();
          window.location.href = "/login";
        }
      }
    }

    // Normalise backend errors to ApiError shape (design p.21)
    const apiError: ApiError = (error.response?.data as ApiError) ?? {
      code: "PersistenceError",
      detail: "An unexpected error occurred.",
    };
    return Promise.reject(apiError);
  }
);

// ── Token helpers (sessionStorage — no localStorage per artifact rules) ────────
export function storeTokens(tokens: AuthTokens): void {
  sessionStorage.setItem("dcp_tokens", JSON.stringify(tokens));
}

export function getStoredTokens(): AuthTokens | null {
  try {
    const raw = sessionStorage.getItem("dcp_tokens");
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}

export function clearTokens(): void {
  sessionStorage.removeItem("dcp_tokens");
}