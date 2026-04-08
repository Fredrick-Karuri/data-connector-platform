// services/connections.ts
// Wired to GET /api/connections/ and POST /api/connections/test/ (design p.20)

import { apiClient } from "./apiClient";
import type { Connection } from "@/types";

export async function listConnections(): Promise<Connection[]> {
  const { data } = await apiClient.get<Connection[]>("/api/connections/");
  return data;
}

export async function createConnection(
  payload: Omit<Connection, "id" | "status" | "last_tested">
): Promise<Connection> {
  const { data } = await apiClient.post<Connection>("/api/connections/", payload);
  return data;
}

export async function testConnection(
  payload: Omit<Connection, "id" | "status" | "last_tested">
): Promise<{ status: "Healthy" | "Offline"; message: string }> {
  const { data } = await apiClient.post("/api/connections/test/", payload);
  return data;
}