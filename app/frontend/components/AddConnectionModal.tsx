// DCP-13 | components/AddConnectionModal.tsx
"use client";
import { useState } from "react";
import type { Connection, DbType } from "@/types";

const DB_TYPES: DbType[] = ["postgres", "mysql", "mongodb", "clickhouse"];

const FIELDS: Record<DbType, string[]> = {
  postgres:   ["host", "port", "user", "password", "database"],
  mysql:      ["host", "port", "user", "password", "database"],
  mongodb:    ["uri", "database"],
  clickhouse: ["host", "port", "user", "password", "database"],
};

interface Props {
  onClose: () => void;
  onSubmit: (payload: { name: string; db_type: DbType; config: Record<string, string | number> }) => Promise<Connection>;
  onTest:   (payload: { name: string; db_type: DbType; config: Record<string, string | number> }) => Promise<{ status: string; message: string }>;
}

export function AddConnectionModal({ onClose, onSubmit, onTest }: Props) {
  const [dbType, setDbType]     = useState<DbType>("postgres");
  const [name, setName]         = useState("");
  const [config, setConfig]     = useState<Record<string, string>>({});
  const [testing, setTesting]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);

  const setField = (k: string, v: string) =>
    setConfig(prev => ({ ...prev, [k]: v }));

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTest({ name, db_type: dbType, config });
      setTestResult(res);
    } catch {
      setTestResult({ status: "Offline", message: "Connection failed." });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSubmit({ name, db_type: dbType, config });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">New Connection</span>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        <label className="field-label">Label</label>
        <input className="field-input" placeholder="e.g. Production MySQL"
          value={name} onChange={e => setName(e.target.value)} />

        <label className="field-label">Database type</label>
        <div className="db-type-grid">
          {DB_TYPES.map(t => (
            <button key={t}
              className={`db-type-btn ${dbType === t ? "active" : ""}`}
              onClick={() => { setDbType(t); setConfig({}); }}>
              {t}
            </button>
          ))}
        </div>

        <div className="fields-grid">
          {FIELDS[dbType].map(field => (
            <div key={field} className={field === "uri" ? "span-2" : ""}>
              <label className="field-label">{field}</label>
              <input
                className="field-input"
                type={field === "password" ? "password" : "text"}
                placeholder={field === "port" ? "5432" : field}
                value={config[field] ?? ""}
                onChange={e => setField(field, e.target.value)}
              />
            </div>
          ))}
        </div>

        {testResult && (
          <div className={`test-result ${testResult.status === "Healthy" ? "success" : "error"}`}>
            {testResult.status === "Healthy" ? "✓" : "✕"} {testResult.message}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-outline" onClick={handleTest} disabled={testing || !name}>
            {testing ? "Testing…" : "Test Connection"}
          </button>
          <button className="btn-primary" onClick={handleSave}
            disabled={saving || !name || !testResult || testResult.status !== "Healthy"}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}