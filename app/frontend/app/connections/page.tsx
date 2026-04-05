// DCP-13 | app/connections/page.tsx
"use client";
import { useState } from "react";
import { useConnections } from "@/hooks/useConnections";
import { ConnectionCard } from "@/components/ConnectionCard";
import { AddConnectionModal } from "@/components/AddConnectionModal";
import { apiClient } from "@/services/apiClient";
import type { Connection } from "@/types";
import { AuthGuard } from "@/components/AuthGuard";

import "./connections.css";

export default function ConnectionsPage() {
  const { connections, loading, error, refresh, add, test } = useConnections();
  const [showModal, setShowModal]   = useState(false);
  const [selected, setSelected]     = useState<Connection | null>(null);
  const [retesting, setRetesting]   = useState<string | null>(null);

  const handleRetest = async (id: string) => {
    setRetesting(id);
    try {
      await apiClient.post(`/api/connections/${id}/retest/`);
      await refresh();
    } finally {
      setRetesting(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this connection?")) return;
    await apiClient.delete(`/api/connections/${id}/`);
    await refresh();
  };

  const healthy  = connections.filter(c => c.status === "Healthy").length;
  const offline  = connections.filter(c => c.status === "Offline").length;
  const untested = connections.filter(c => c.status === "Untested").length;

  return (
    <AuthGuard>
    <div className="page">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Connections</h1>
          <p className="page-sub">Manage source database connections</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Connection
        </button>
      </div>

      {/* ── Stats row ── */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-num healthy">{healthy}</span>
          <span className="stat-label">Healthy</span>
        </div>
        <div className="stat-card">
          <span className="stat-num offline">{offline}</span>
          <span className="stat-label">Offline</span>
        </div>
        <div className="stat-card">
          <span className="stat-num muted">{untested}</span>
          <span className="stat-label">Untested</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{connections.length}</span>
          <span className="stat-label">Total</span>
        </div>
      </div>

      {/* ── Content ── */}
      {loading && <div className="loading-bar" />}
      {error   && <div className="error-banner">{error}</div>}

      {!loading && connections.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">⬡</span>
          <p>No connections yet. Add your first source database.</p>
        </div>
      )}

      <div className="cards-grid">
        {connections.map(c => (
          <ConnectionCard
            key={c.id}
            connection={c}
            onRetest={handleRetest}
            onDelete={handleDelete}
            onSelect={setSelected}
          />
        ))}
      </div>

      {/* ── Detail panel ── */}
      {selected && (
        <div className="detail-panel">
          <div className="detail-header">
            <span className="detail-title">{selected.name}</span>
            <button className="btn-ghost" onClick={() => setSelected(null)}>✕</button>
          </div>
          <table className="detail-table">
            <tbody>
              <tr><td>Type</td><td>{selected.db_type}</td></tr>
              <tr><td>Status</td><td>{selected.status}</td></tr>
              <tr><td>Last tested</td>
                <td>{selected.last_tested
                  ? new Date(selected.last_tested).toLocaleString()
                  : "Never"}</td>
              </tr>
              {Object.entries(selected.config ?? {})
                .filter(([k]) => k !== "password")
                .map(([k, v]) => (
                  <tr key={k}><td>{k}</td><td>{String(v)}</td></tr>
                ))}
            </tbody>
          </table>
          <a className="btn-primary extract-link"
             href={`/extract?connection_id=${selected.id}`}>
            Extract data →
          </a>
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <AddConnectionModal
          onClose={() => setShowModal(false)}
          onSubmit={add}
          onTest={test}
        />
      )}
    </div>
    </AuthGuard>
  );
}