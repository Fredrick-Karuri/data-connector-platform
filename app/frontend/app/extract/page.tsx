// DCP-15 | app/extract/page.tsx
// Query form → POST /api/extract/ → poll status → populate EditableGrid
// Design ref: p.6-8, p.15 (job polling), p.20 (endpoints)
"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useConnections }  from "@/hooks/useConnections";
import { useExtraction }   from "@/hooks/useExtraction";
import { useDiffTracker }  from "@/hooks/useDiffTracker";
import { useSubmission }   from "@/hooks/useSubmission";
import { EditableGrid }    from "@/components/EditableGrid";
import { JobProgressBar }  from "@/components/JobProgressBar";
import type { DbType }     from "@/types";
import "./extract.css";

const QUERY_PLACEHOLDERS: Record<string, string> = {
  postgres:   "SELECT * FROM inventory_items LIMIT 500",
  mysql:      "SELECT * FROM customer_leads LIMIT 500",
  mongodb:    "user_logs|{}",
  clickhouse: "SELECT * FROM sensor_readings LIMIT 500",
};

const MAX_BATCH = 10_000;

function ExtractPageInner() {
  const searchParams              = useSearchParams();
  const preselectedId             = searchParams.get("connection_id") ?? "";

  const { connections, loading: loadingConns } = useConnections();
  const { state: extraction, run, reset }      = useExtraction();
  const [connId, setConnId]   = useState(preselectedId);
  const [query, setQuery]     = useState("");
  const [batchSize, setBatchSize] = useState(500);
  const [format, setFormat]   = useState<"csv" | "json">("json");

  // Pre-fill query placeholder when connection type changes
  useEffect(() => {
    const conn = connections.find(c => c.id === connId);
    if (conn) setQuery(QUERY_PLACEHOLDERS[conn.db_type as DbType] ?? "");
  }, [connId, connections]);

  // Pre-select connection from URL param once connections load
  useEffect(() => {
    if (preselectedId && connections.length) setConnId(preselectedId);
  }, [preselectedId, connections]);

  const tracker   = useDiffTracker(extraction.rows);
  const { submit, submitting, submitError, submitResult } = useSubmission();

  const handleExtract = async () => {
    if (!connId || !query) return;
    reset();
    await run(connId, query, batchSize);
  };

  const handleSubmit = async () => {
    const { original_data, modified_data } = tracker.getSubmitPayload();
    await submit({
      job_id:        extraction.jobId!,
      original_data, modified_data,
      format,
    });
  };

  const selectedConn = connections.find(c => c.id === connId);
  const isRunning    = extraction.status === "PENDING" || extraction.status === "PROGRESS";
  const hasRows      = extraction.rows.length > 0;
  const canExtract   = Boolean(connId && query && !isRunning);

  return (
    <div className="extract-page">
      {/* ── Left panel: query form ── */}
      <aside className="query-panel">
        <div className="panel-header">
          <span className="panel-title">Extract</span>
          {submitResult && (
            <a className="file-link" href="/files">
              View file ↗
            </a>
          )}
        </div>

        {/* Connection select */}
        <label className="field-label">Source</label>
        {loadingConns ? (
          <div className="skeleton" />
        ) : (
          <select
            className="field-select"
            value={connId}
            onChange={e => setConnId(e.target.value)}
          >
            <option value="">Select a connection…</option>
            {connections.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.db_type})
              </option>
            ))}
          </select>
        )}

        {/* DB type indicator */}
        {selectedConn && (
          <div className="conn-meta">
            <span className={`conn-dot ${selectedConn.status === "Healthy" ? "healthy" : "offline"}`} />
            <span>{selectedConn.status}</span>
          </div>
        )}

        {/* Query */}
        <label className="field-label" style={{ marginTop: "1rem" }}>
          Query
          {selectedConn?.db_type === "mongodb" && (
            <span className="field-hint"> — collection|&#123;filter&#125;</span>
          )}
        </label>
        <textarea
          className="field-textarea"
          rows={6}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={selectedConn
            ? QUERY_PLACEHOLDERS[selectedConn.db_type] ?? "Enter query"
            : "Select a connection first"}
          spellCheck={false}
        />

        {/* Batch size */}
        <label className="field-label">
          Batch size
          <span className="field-hint"> max {MAX_BATCH.toLocaleString()}</span>
        </label>
        <div className="batch-row">
          <input
            type="range" min={10} max={MAX_BATCH} step={10}
            value={batchSize}
            onChange={e => setBatchSize(Number(e.target.value))}
            className="batch-slider"
          />
          <input
            type="number" min={10} max={MAX_BATCH}
            value={batchSize}
            onChange={e => setBatchSize(Math.min(Number(e.target.value), MAX_BATCH))}
            className="batch-number"
          />
        </div>

        {/* Progress */}
        <JobProgressBar
          status={extraction.status}
          progress={extraction.progress}
          jobId={extraction.jobId}
          error={extraction.error}
        />

        {/* Actions */}
        <button
          className="btn-extract"
          onClick={handleExtract}
          disabled={!canExtract}
        >
          {isRunning ? (
            <><span className="spinner" /> Extracting…</>
          ) : "Run Extraction ↗"}
        </button>

        {hasRows && !isRunning && (
          <div className="extract-summary">
            <span className="summary-num">{extraction.rows.length}</span>
            <span className="summary-label">rows loaded</span>
          </div>
        )}

        {/* Navigation */}
        <div className="panel-nav">
          <a href="/connections" className="nav-link">← Connections</a>
          <a href="/files" className="nav-link">Files →</a>
        </div>
      </aside>

      {/* ── Right panel: editable grid ── */}
      <main className="grid-panel">
        {!hasRows && !isRunning && (
          <div className="grid-empty">
            <div className="grid-empty-icon">⬡</div>
            <p>Run an extraction to load data into the grid.</p>
            <p className="grid-empty-sub">Results will appear here once the job completes.</p>
          </div>
        )}

        {isRunning && !hasRows && (
          <div className="grid-loading">
            <div className="loading-pulse" />
            <p>Fetching data from source…</p>
          </div>
        )}

        {hasRows && (
          <EditableGrid
            tracker={tracker}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitError={submitError}
            format={format}
            onFormatChange={setFormat}
          />
        )}
      </main>
    </div>
  );
}

export default function ExtractPage() {
  return (
    <Suspense>
      <ExtractPageInner />
    </Suspense>
  );
}