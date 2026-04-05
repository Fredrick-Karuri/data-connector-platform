"use client";
import { useState } from "react";
import { useFiles }     from "@/hooks/useFiles";
import { AuthGuard }    from "@/components/AuthGuard";
import { s }            from "@/styles/files";
import type { FileMetadata } from "@/types";

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
        file.file_id, file.format,
        `export_${(file.source_metadata?.source_db as string ?? "data").replace(/\s+/g, "_")}_${file.file_id.slice(0, 8)}.${file.format}`,
      );
    } catch (e: unknown) {
      setDlError(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <AuthGuard>
      <div className={s.page}>
        {/* ── Header ── */}
        <div className={s.header}>
          <div>
            <h1 className={s.title}>Exports</h1>
            <p className={s.sub}>Your generated data files</p>
          </div>
          <div className={s.headerActions}>
            <input className={s.search} placeholder="Search files…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <button className={s.btnGhost} onClick={refresh}>↺ Refresh</button>
            <a href="/extract" className={s.btnPrimary}>+ New Extraction</a>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className={s.stats}>
          <div className={s.stat}><span className={s.statNum}>{files.length}</span><span className={s.statLabel}>Total</span></div>
          <div className={s.stat}><span className={s.statNum}>{files.filter(f => f.format === "json").length}</span><span className={s.statLabel}>JSON</span></div>
          <div className={s.stat}><span className={s.statNum}>{files.filter(f => f.format === "csv").length}</span><span className={s.statLabel}>CSV</span></div>
        </div>

        {/* ── States ── */}
        {dlError  && <div className={s.errorBanner}>{dlError}</div>}
        {error    && <div className={s.errorBanner}>{error}</div>}
        {loading  && <div className={s.loadingBar} />}

        {!loading && files.length === 0 && (
          <div className={s.emptyState}>
            <span className={s.emptyIcon}>{ }</span>
            <p>No exports yet.</p>
            <a href="/extract" className={s.btnPrimary} style={{ marginTop: "1rem" }}>
              Run your first extraction →
            </a>
          </div>
        )}

        {/* ── Table ── */}
        {filtered.length > 0 && (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  {["Format", "Source", "Rows", "Checksum", "Created", ""].map(h => (
                    <th key={h} className={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(file => (
                  <FileRow key={file.file_id} file={file}
                    isDownloading={downloading === file.file_id}
                    onDownload={handleDownload} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && files.length > 0 && filtered.length === 0 && (
          <div className={s.emptyState}>
            <p>No files match <strong>{search}</strong></p>
          </div>
        )}

        {/* ── Nav ── */}
        <div className={s.nav}>
          <a href="/connections" className={s.navLink}>← Connections</a>
          <a href="/extract"    className={s.navLink}>Extract →</a>
        </div>
      </div>
    </AuthGuard>
  );
}

function FileRow({ file, isDownloading, onDownload }: {
  file: FileMetadata; isDownloading: boolean; onDownload: (f: FileMetadata) => void;
}) {
  const source   = (file.source_metadata?.source_db as string) ?? "—";
  const rows     = (file.source_metadata?.rows_total as number) ?? "—";
  const created  = new Date(file.created_at).toLocaleString();
  const checksum = file.checksum ? `${file.checksum.slice(0, 8)}…` : "—";

  return (
    <tr className={s.row}>
      <td className={s.td}>
        <span className={file.format === "json" ? s.badgeJson : s.badgeCsv}>
          {FORMAT_ICON[file.format]} {file.format.toUpperCase()}
        </span>
      </td>
      <td className={s.td}>
        <span className={s.sourceName}>{source}</span>
        <span className={s.fileId}>{file.file_id.slice(0, 8)}…</span>
      </td>
      <td className={s.numCell}>{rows.toLocaleString()}</td>
      <td className={s.checksumCell} title={file.checksum}>{checksum}</td>
      <td className={s.dateCell}>{created}</td>
      <td className={s.actionCell}>
        <button className={s.btnDownload} onClick={() => onDownload(file)} disabled={isDownloading}>
          {isDownloading ? "…" : "↓ Download"}
        </button>
      </td>
    </tr>
  );
}