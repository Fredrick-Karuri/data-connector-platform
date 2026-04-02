// DCP-03 | services/auth.ts

import { apiClient, storeTokens, clearTokens } from "./apiClient";
import type { AuthTokens, AuthUser } from "@/types";

export async function login(username: string, password: string): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthTokens & { user: AuthUser }>(
    "/api/auth/token/",
    { username, password }
  );
  storeTokens({ access: data.access, refresh: data.refresh });
  return data.user;
}

export async function logout(): Promise<void> {
  clearTokens();
}