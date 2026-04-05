"use client";
import { useState } from "react";
import { s } from "@/styles/connections";
import type { Connection, DbType } from "@/types";

const DB_TYPES: DbType[] = ["postgres", "mysql", "mongodb", "clickhouse"];
const FIELDS: Record<DbType, string[]> = {
  postgres:   ["host", "port", "user", "password", "database"],
  mysql:      ["host", "port", "user", "password", "database"],
  mongodb:    ["uri", "database"],
  clickhouse: ["host", "port", "user", "password", "database"],
};

interface Props {
  onClose:  () => void;
  onSubmit: (payload: { name: string; db_type: DbType; config: Record<string, string | number> }) => Promise<Connection>;
  onTest:   (payload: { name: string; db_type: DbType; config: Record<string, string | number> }) => Promise<{ status: string; message: string }>;
}

export function AddConnectionModal({ onClose, onSubmit, onTest }: Props) {
  const [dbType, setDbType]   = useState<DbType>("postgres");
  const [name, setName]       = useState("");
  const [config, setConfig]   = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);

  const setField = (k: string, v: string) => setConfig(prev => ({ ...prev, [k]: v }));

  const handleTest = async () => {
    setTesting(true); setTestResult(null);
    try {
      setTestResult(await onTest({ name, db_type: dbType, config }));
    } catch {
      setTestResult({ status: "Offline", message: "Connection failed." });
    } finally { setTesting(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSubmit({ name, db_type: dbType, config }); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <span className={s.modalTitle}>New Connection</span>
          <button className={s.btnGhost} onClick={onClose}>✕</button>
        </div>

        <label className={s.fieldLabel}>Label</label>
        <input className={s.fieldInput} placeholder="e.g. Production MySQL"
          value={name} onChange={e => setName(e.target.value)} />

        <label className={s.fieldLabel}>Database type</label>
        <div className={s.dbTypeGrid}>
          {DB_TYPES.map(t => (
            <button key={t}
              className={dbType === t ? s.dbTypeBtnActive : s.dbTypeBtn}
              onClick={() => { setDbType(t); setConfig({}); }}>
              {t}
            </button>
          ))}
        </div>

        <div className={s.fieldsGrid}>
          {FIELDS[dbType].map(field => (
            <div key={field} className={field === "uri" ? s.span2 : ""}>
              <label className={s.fieldLabel}>{field}</label>
              <input className={s.fieldInput}
                type={field === "password" ? "password" : "text"}
                placeholder={field === "port" ? "5432" : field}
                value={config[field] ?? ""}
                onChange={e => setField(field, e.target.value)} />
            </div>
          ))}
        </div>

        {testResult && (
          <div className={testResult.status === "Healthy" ? s.testSuccess : s.testError}>
            {testResult.status === "Healthy" ? "✓" : "✕"} {testResult.message}
          </div>
        )}

        <div className={s.modalFooter}>
          <button className={s.btnOutline} onClick={handleTest} disabled={testing || !name}>
            {testing ? "Testing…" : "Test Connection"}
          </button>
          <button className={s.btnPrimary} onClick={handleSave}
            disabled={saving || !name || !testResult || testResult.status !== "Healthy"}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}