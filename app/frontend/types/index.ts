// types/index.ts
// Shared types aligned with backend models (design p.13-14)

export type UserRole = "admin" | "user";

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

// ── Connection Manager (design p.4) ──────────────────────────────────────────
export type DbType = "postgres" | "mysql" | "mongodb" | "clickhouse";
export type ConnectionStatus = "Healthy" | "Offline" | "Untested";

export interface Connection {
  id: string;
  name: string;
  db_type: DbType;
  config: Record<string, string | number>;
  status: ConnectionStatus;
  last_tested: string | null;
}

// ── Extraction Pipeline (design p.6) ─────────────────────────────────────────
export type JobStatus = "PENDING" | "PROGRESS" | "SUCCESS" | "FAILED";

export interface ExtractionJob {
  job_id: string;
  connection_id: string;
  batch_size: number;
  status: JobStatus;
  result_preview: Row[] | null;
  rows?: Row[];
  progress?: number;
  cache_expired?: boolean;
  created_at: string;
}

// ── Editable Grid (design p.8) ───────────────────────────────────────────────
export type Row = Record<string, unknown>;

export interface CellDiff {
  old: unknown;
  new: unknown;
}

// { row_id: { field_name: { old, new } } }
export type DiffMap = Record<string, Record<string, CellDiff>>;

// ── File Storage (design p.10-11) ────────────────────────────────────────────
export type FileFormat = "csv" | "json";
export type AccessLevel = "VIEWER" | "DOWNLOADER";

export interface FileMetadata {
  file_id: string;
  format: FileFormat;
  owner_id: string;
  source_metadata: Record<string, unknown>;
  checksum: string;
  created_at: string;
}

// ── API Payloads ──────────────────────────────────────────────────────────────
export interface ExtractPayload {
  connection_id: string;
  query: string;
  batch_size: number;
}

export interface SubmitBatchPayload {
  job_id: string;
  original_data: Row[];
  modified_data: Row[];
  format: FileFormat;
}

// ── Error Responses (design p.21) ────────────────────────────────────────────
export interface ApiError {
  code: "ConnectionError" | "ExtractionError" | "TransformationError" | "PersistenceError";
  detail: string;
  row_errors?: Record<string, string>; // row_id → error message
}