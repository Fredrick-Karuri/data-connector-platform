"use client";
import { progress as p } from "@/styles/components";
import type { JobStatus } from "@/types";

interface Props {
  status:   JobStatus | null;
  progress: number;
  jobId:    string | null;
  error:    string | null;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Queued", PROGRESS: "Extracting", SUCCESS: "Complete", FAILED: "Failed",
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: p.statusPending, PROGRESS: p.statusProgress,
  SUCCESS: p.statusSuccess, FAILED: p.statusFailed,
};

export function JobProgressBar({ status, progress, jobId, error }: Props) {
  if (!status) return null;

  const pct       = Math.min(Math.max(progress, 0), 100);
  const isActive  = status === "PENDING" || status === "PROGRESS";
  const isFailed  = status === "FAILED";

  const fillClass = isFailed ? p.fillFailed : isActive ? p.fillAnimated : p.fill;

  return (
    <div className={p.wrap}>
      <div className={p.meta}>
        <span className={STATUS_CLASS[status] ?? p.statusDefault}>
          {STATUS_LABEL[status] ?? status}
        </span>
        {jobId && <span className={p.jobId}>job: {jobId.slice(0, 8)}…</span>}
        {isActive && <span className={p.pct}>{pct}%</span>}
      </div>
      <div className={p.track}>
        <div className={fillClass} style={{ width: `${isActive ? Math.max(pct, 5) : 100}%` }} />
      </div>
      {isFailed && error && <div className={p.error}>{error}</div>}
    </div>
  );
}