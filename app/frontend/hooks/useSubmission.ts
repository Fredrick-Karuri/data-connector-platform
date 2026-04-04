// DCP-15 | hooks/useSubmission.ts
// Wraps POST /api/submit-batch/ — used by ExtractPage after editing.
"use client";
import { useState, useCallback } from "react";
import { submitBatch } from "@/services/submission";
import type { ApiError, FileFormat, Row } from "@/types";

interface SubmitPayload {
  job_id:        string;
  original_data: Row[];
  modified_data: Row[];
  format:        FileFormat;
}

export function useSubmission() {
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState<ApiError | null>(null);
  const [submitResult, setSubmitResult] = useState<{ file_id: string } | null>(null);

  const submit = useCallback(async (payload: SubmitPayload) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitResult(null);
    try {
      const result = await submitBatch(payload);
      setSubmitResult(result);
    } catch (err: unknown) {
      setSubmitError(err as ApiError);
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { submit, submitting, submitError, submitResult };
}