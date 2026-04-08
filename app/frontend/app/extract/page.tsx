// app/extract/page.tsx
"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams }  from "next/navigation";
import { useConnections }   from "@/hooks/useConnections";
import { useExtraction }    from "@/hooks/useExtraction";
import { useDiffTracker }   from "@/hooks/useDiffTracker";
import { useSubmission }    from "@/hooks/useSubmission";
import { EditableGrid }     from "@/components/EditableGrid";
import { JobProgressBar }   from "@/components/JobProgressBar";
import { AuthGuard }        from "@/components/AuthGuard";
import { s }                from "@/styles/extract";
import type { DbType }      from "@/types";


const QUERY_PLACEHOLDERS: Record<string, string> = {
  postgres:   "SELECT * FROM inventory_items LIMIT 500",
  mysql:      "SELECT * FROM customer_leads LIMIT 500",
  mongodb:    "user_logs|{}",
  clickhouse: "SELECT * FROM sensor_readings LIMIT 500",
};

const MAX_BATCH = 10_000;

function ExtractPageInner() {
  const searchParams  = useSearchParams();
  const preselectedId = searchParams.get("connection_id") ?? "";

  const { connections, loading: loadingConns } = useConnections();
  const { state: extraction, run, reset }      = useExtraction();
  const [connId, setConnId]       = useState(preselectedId);
  const [query, setQuery]         = useState("");
  const [batchSize, setBatchSize] = useState(500);
  const [format, setFormat]       = useState<"csv" | "json">("json");

  useEffect(() => {
    const conn = connections.find(c => c.id === connId);
    if (conn) setQuery(QUERY_PLACEHOLDERS[conn.db_type as DbType] ?? "");
  }, [connId, connections]);

  useEffect(() => {
    if (preselectedId && connections.length) setConnId(preselectedId);
  }, [preselectedId, connections]);

  const tracker = useDiffTracker(extraction.rows);
  const { submit, submitting, submitError, submitResult } = useSubmission();

  const handleExtract = async () => {
    if (!connId || !query) return;
    reset();
    await run(connId, query, batchSize);
  };

  const handleSubmit = async () => {
    const { original_data, modified_data } = tracker.getSubmitPayload();
    await submit({ job_id: extraction.jobId!, original_data, modified_data, format });
  };

  const selectedConn = connections.find(c => c.id === connId);
  const isRunning    = extraction.status === "PENDING" || extraction.status === "PROGRESS";
  const hasRows      = extraction.rows.length > 0;
  const canExtract   = Boolean(connId && query && !isRunning);

  return (
    <div className={s.page}>
      <aside className={s.queryPanel}>
        <div className={s.panelHeader}>
          <span className={s.panelTitle}>Extract</span>
          {submitResult && <a className={s.fileLink} href="/files">View file ↗</a>}
        </div>

        <label className={s.fieldLabel}>Source</label>
        {loadingConns ? <div className={s.skeleton} /> : (
          <select className={s.fieldSelect} value={connId} onChange={e => setConnId(e.target.value)}>
            <option value="">Select a connection…</option>
            {connections.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.db_type})</option>
            ))}
          </select>
        )}

        {selectedConn && (
          <div className={s.connMeta}>
            <span className={selectedConn.status === "Healthy" ? s.connDotHealthy : s.connDotOffline} />
            <span>{selectedConn.status}</span>
          </div>
        )}

        <label className={s.fieldLabel} style={{ marginTop: "1rem" }}>
          Query
          {selectedConn?.db_type === "mongodb" && (
            <span className={s.fieldHint}> — collection|&#123;filter&#125;</span>
          )}
        </label>
        <textarea
          className={s.fieldTextarea} rows={6} value={query} spellCheck={false}
          onChange={e => setQuery(e.target.value)}
          placeholder={selectedConn ? QUERY_PLACEHOLDERS[selectedConn.db_type] ?? "Enter query" : "Select a connection first"}
        />

        <label className={s.fieldLabel}>
          Batch size <span className={s.fieldHint}>max {MAX_BATCH.toLocaleString()}</span>
        </label>
        <div className={s.batchRow}>
          <input type="range" min={10} max={MAX_BATCH} step={10} value={batchSize}
            onChange={e => setBatchSize(Number(e.target.value))} className={s.batchSlider} />
          <input type="number" min={10} max={MAX_BATCH} value={batchSize}
            onChange={e => setBatchSize(Math.min(Number(e.target.value), MAX_BATCH))}
            className={s.batchNumber} />
        </div>

        <JobProgressBar
          status={extraction.status} progress={extraction.progress}
          jobId={extraction.jobId} error={extraction.error}
        />

        <button className={s.btnExtract} onClick={handleExtract} disabled={!canExtract}>
          {isRunning ? <><span className={s.spinner} /> Extracting…</> : "Run Extraction ↗"}
        </button>

        {hasRows && !isRunning && (
          <div className={s.summary}>
            <span className={s.summaryNum}>{extraction.rows.length}</span>
            <span className={s.summaryLabel}>rows loaded</span>
          </div>
        )}

        <div className={s.panelNav}>
          <a href="/connections" className={s.navLink}>← Connections</a>
          <a href="/files" className={s.navLink}>Files →</a>
        </div>
      </aside>

      <main className={s.gridPanel}>
        {!hasRows && !isRunning && (
          <div className={s.gridEmpty}>
            <div className={s.gridEmptyIcon}>⬡</div>
            <p>Run an extraction to load data into the grid.</p>
            <p className={s.gridEmptySub}>Results will appear here once the job completes.</p>
          </div>
        )}
        {isRunning && !hasRows && (
          <div className={s.gridLoading}>
            <div className={s.loadingPulse} />
            <p>Fetching data from source…</p>
          </div>
        )}
        {hasRows && (
          <EditableGrid tracker={tracker} onSubmit={handleSubmit}
            submitting={submitting} submitError={submitError}
            format={format} onFormatChange={setFormat} />
        )}
      </main>
    </div>
  );
}

export default function ExtractPage() {
  return (
    <AuthGuard>
      <Suspense><ExtractPageInner /></Suspense>
    </AuthGuard>
  );
}