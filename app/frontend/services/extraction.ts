// DCP-03 | services/extraction.ts
// POST /api/extract/ → returns job_id immediately (design p.6, p.20)
// GET /api/jobs/{job_id}/ → poll until SUCCESS or FAILED

import { apiClient } from "./apiClient";
import type { ExtractPayload, ExtractionJob } from "@/types";

export async function startExtraction(payload: ExtractPayload): Promise<{ job_id: string }> {
  const { data } = await apiClient.post<{ job_id: string }>("/api/extract/", payload);
  return data;
}

export async function getJobStatus(jobId: string): Promise<ExtractionJob> {
  const { data } = await apiClient.get<ExtractionJob>(`/api/jobs/${jobId}/`);
  return data;
}

// Polls every 2s until SUCCESS or FAILED, then resolves (design p.15 — job polling)
export function pollJob(
  jobId: string,
  onProgress: (job: ExtractionJob) => void,
  intervalMs = 2000
): Promise<ExtractionJob> {
  return new Promise((resolve, reject) => {
    const timer = setInterval(async () => {
      try {
        const job = await getJobStatus(jobId);
        onProgress(job);
        if (job.status === "SUCCESS" || job.status === "FAILED") {
          clearInterval(timer);
          job.status === "SUCCESS" ? resolve(job) : reject(job);
        }
      } catch (err) {
        clearInterval(timer);
        reject(err);
      }
    }, intervalMs);
  });
}