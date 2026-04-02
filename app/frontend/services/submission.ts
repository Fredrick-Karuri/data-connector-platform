// DCP-03 | services/submission.ts
// POST /api/submit-batch/ — dual storage trigger (design p.10-11, p.20)
// GET /api/files/ and GET /api/files/{id}/download/ — RBAC gated (design p.12)

import { apiClient } from "./apiClient";
import type { FileMetadata, SubmitBatchPayload } from "@/types";

export async function submitBatch(
  payload: SubmitBatchPayload
): Promise<{ file_id: string }> {
  const { data } = await apiClient.post<{ file_id: string }>(
    "/api/submit-batch/",
    payload
  );
  return data;
}

export async function listFiles(): Promise<FileMetadata[]> {
  const { data } = await apiClient.get<FileMetadata[]>("/api/files/");
  return data;
}

// Streams file download — backend serves via FileResponse (design p.12)
export async function downloadFile(fileId: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(
    `/api/files/${fileId}/download/`,
    { responseType: "blob" }
  );
  return data;
}