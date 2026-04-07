// DCP-15 | hooks/useExtraction.ts
// Wraps POST /api/extract/ → pollJob() → populates grid rows.
// Design ref: p.6-7 — job_id returned immediately, 2s polling until SUCCESS/FAILED
"use client";
import { useState, useCallback } from "react";
import { startExtraction, pollJob } from "@/services/extraction";
import type { ExtractionJob, Row, JobStatus } from "@/types";

export interface ExtractionState {
  jobId:      string | null;
  status:     JobStatus | null;
  progress:   number;           // 0-100
  rows:       Row[];
  error:      string | null;
  loading:    boolean;
}

const INITIAL: ExtractionState = {
  jobId: null, status: null, progress: 0,
  rows: [], error: null, loading: false,
};

export function useExtraction() {
  const [state, setState] = useState<ExtractionState>(INITIAL);

  const run = useCallback(async (
    connectionId: string,
    query: string,
    batchSize: number,
  ) => {
    setState({ ...INITIAL, loading: true });

    try {
      // POST /api/extract/ → returns job_id immediately (design p.6)
      const { job_id } = await startExtraction({
        connection_id: connectionId,
        query,
        batch_size: batchSize,
      });

      setState(prev => ({ ...prev, jobId: job_id, status: "PENDING" }));

      // Poll every 2s until SUCCESS or FAILED (design p.7, services/extraction.ts)
      const job = await pollJob(
        job_id,
        (update: ExtractionJob) => {
          setState(prev => ({
            ...prev,
            status:   update.status,
            progress: (update as ExtractionJob & { progress?: number }).progress ?? prev.progress,
          }));
        },
        2000,
      );

      if (job.status === "SUCCESS") {
        setState(prev => ({
          ...prev,
          loading:  false,
          status:   "SUCCESS",
          progress: 100,
          rows:     job.rows ?? job.result_preview ?? [],
        }));
      }

    } catch (err: unknown) {
      const job = err as ExtractionJob & { error_message?: string };
      setState(prev => ({
        ...prev,
        loading: false,
        status:  "FAILED",
        error:   job?.error_message ?? "Extraction failed.",
      }));
    }
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  return { state, run, reset };
}