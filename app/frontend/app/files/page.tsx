// app/files/page.tsx
// Lists files accessible to the current user (owner + shared).
// Download triggers GET /api/files/{id}/download/ — RBAC checked server-side (design p.12).
"use client";
import { useState } from "react";
import { useFiles } from "@/hooks/useFiles";
import type { FileMetadata } from "@/types";
import "./files.css";
import { AuthGuard } from "@/components/AuthGuard";

const FORMAT_ICON: Record<string, string> = { csv: "⊞", json: "{ }" };

export default function FilesPage() {
  const { files, loading, error, refresh, download } = useFiles();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [dlError, setDlError]         = useState<string | null>(null);
  const [search, setSearch]           = useState("");

  const filtered = files.filter(f => {
    const meta = JSON.stringify(f.source_metadata ?? {}).toLowerCase();
    return (
      f.file_id.toLowerCase().includes(search.toLowerCase()) ||
      meta.includes(search.toLowerCase()) ||
      f.format.includes(search.toLowerCase())
    );
  });

  const handleDownload = async (file: FileMetadata) => {
    setDownloading(file.file_id);
    setDlError(null);
    try {
      await download(
        file.file_id,
        file.format,
        `export_${(file.source_metadata?.source_db as string ?? "data")
          .replace(/\s+/g, "_")}_${file.file_id.slice(0, 8)}.${file.format}`,
      );
    } catch (e: unknown) {
      setDlError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <AuthGuard>
    
    <div className="files-page">
      {/* ── Header ── */}
      <div className="files-header">
        <div>
          <h1 className="files-title">Exports</h1>
          <p className="files-sub">Your generated data files</p>
        </div>
        <div className="header-actions">
          <input
            className="files-search"
            placeholder="Search files…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn-ghost" onClick={refresh}>↺ Refresh</button>
          <a href="/extract" className="btn-primary">+ New Extraction</a>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="files-stats">
        <div className="fstat">
          <span className="fstat-num">{files.length}</span>
          <span className="fstat-label">Total</span>
        </div>
        <div className="fstat">
          <span className="fstat-num">{files.filter(f => f.format === "json").length}</span>
          <span className="fstat-label">JSON</span>
        </div>
        <div className="fstat">
          <span className="fstat-num">{files.filter(f => f.format === "csv").length}</span>
          <span className="fstat-label">CSV</span>
        </div>
      </div>

      {/* ── Error / loading ── */}
      {dlError && <div className="error-banner">{dlError}</div>}
      {error   && <div className="error-banner">{error}</div>}
      {loading && <div className="loading-bar" />}

      {/* ── Empty state ── */}
      {!loading && files.length === 0 && (
        <div className="files-empty">
          <span className="empty-icon">{ }</span>
          <p>No exports yet.</p>
          <a href="/extract" className="btn-primary" style={{ marginTop: "1rem" }}>
            Run your first extraction →
          </a>
        </div>
      )}

      {/* ── File table ── */}
      {filtered.length > 0 && (
        <div className="files-table-wrap">
          <table className="files-table">
            <thead>
              <tr>
                <th>Format</th>
                <th>Source</th>
                <th>Rows</th>
                <th>Checksum</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(file => (
                <FileRow
                  key={file.file_id}
                  file={file}
                  isDownloading={downloading === file.file_id}
                  onDownload={handleDownload}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── No results ── */}
      {!loading && files.length > 0 && filtered.length === 0 && (
        <div className="files-empty">
          <p>No files match <strong>{search}</strong></p>
        </div>
      )}

      {/* ── Nav ── */}
      <div className="files-nav">
        <a href="/connections" className="nav-link">← Connections</a>
        <a href="/extract"    className="nav-link">Extract →</a>
      </div>
    </div>
    </AuthGuard>
  );
}

// ── File row ──────────────────────────────────────────────────────────────────

function FileRow({
  file, isDownloading, onDownload,
}: {
  file:          FileMetadata;
  isDownloading: boolean;
  onDownload:    (f: FileMetadata) => void;
}) {
  const source   = (file.source_metadata?.source_db as string) ?? "—";
  const rows     = (file.source_metadata?.rows_total as number) ?? "—";
  const created  = new Date(file.created_at).toLocaleString();
  const checksum = file.checksum ? `${file.checksum.slice(0, 8)}…` : "—";

  return (
    <tr className="file-row">
      <td>
        <span className={`format-badge ${file.format}`}>
          {FORMAT_ICON[file.format]} {file.format.toUpperCase()}
        </span>
      </td>
      <td className="source-cell">
        <span className="source-name">{source}</span>
        <span className="file-id">{file.file_id.slice(0, 8)}…</span>
      </td>
      <td className="num-cell">{rows.toLocaleString()}</td>
      <td className="checksum-cell" title={file.checksum}>{checksum}</td>
      <td className="date-cell">{created}</td>
      <td className="action-cell">
        <button
          className="btn-download"
          onClick={() => onDownload(file)}
          disabled={isDownloading}
        >
          {isDownloading ? "…" : "↓ Download"}
        </button>
      </td>
    </tr>
  );
}