// DCP-15 | components/JobProgressBar.tsx
"use client";
import type { JobStatus } from "@/types";

interface Props {
  status:   JobStatus | null;
  progress: number;
  jobId:    string | null;
  error:    string | null;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:  "Queued",
  PROGRESS: "Extracting",
  SUCCESS:  "Complete",
  FAILED:   "Failed",
};

export function JobProgressBar({ status, progress, jobId, error }: Props) {
  if (!status) return null;

  const pct        = Math.min(Math.max(progress, 0), 100);
  const isActive   = status === "PENDING" || status === "PROGRESS";
  const isFailed   = status === "FAILED";
  const isSuccess  = status === "SUCCESS";

  return (
    <div className="progress-wrap">
      <div className="progress-meta">
        <span className={`progress-status ${status?.toLowerCase()}`}>
          {STATUS_LABEL[status] ?? status}
        </span>
        {jobId && (
          <span className="progress-jobid">
            job: {jobId.slice(0, 8)}…
          </span>
        )}
        {isActive && <span className="progress-pct">{pct}%</span>}
      </div>

      <div className="progress-track">
        <div
          className={`progress-fill ${isFailed ? "failed" : ""} ${isActive ? "animated" : ""}`}
          style={{ width: `${isActive ? Math.max(pct, 5) : 100}%` }}
        />
      </div>

      {isFailed && error && (
        <div className="progress-error">{error}</div>
      )}
    </div>
  );
}