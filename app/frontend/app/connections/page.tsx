"use client";
import { useState } from "react";
import { useConnections } from "@/hooks/useConnections";
import { ConnectionCard } from "@/components/ConnectionCard";
import { AddConnectionModal } from "@/components/AddConnectionModal";
import { AuthGuard } from "@/components/AuthGuard";
import { apiClient } from "@/services/apiClient";
import { s } from "@/styles/connections";
import type { Connection } from "@/types";

export default function ConnectionsPage() {
  const { connections, loading, error, refresh, add, test } = useConnections();
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected]   = useState<Connection | null>(null);
  const [retesting, setRetesting] = useState<string | null>(null);

  const handleRetest = async (id: string) => {
    setRetesting(id);
    try {
      await apiClient.post(`/api/connections/${id}/retest/`);
      await refresh();
    } finally { setRetesting(null); }
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
      <div className={s.page}>
        {/* ── Header ── */}
        <div className={s.header}>
          <div>
            <h1 className={s.title}>Connections</h1>
            <p className={s.sub}>Manage source database connections</p>
          </div>
          <button className={s.btnPrimary} onClick={() => setShowModal(true)}>
            + New Connection
          </button>
        </div>

        {/* ── Stats ── */}
        <div className={s.statsRow}>
          <div className={s.statCard}><span className={s.statHealthy}>{healthy}</span><span className={s.statLabel}>Healthy</span></div>
          <div className={s.statCard}><span className={s.statOffline}>{offline}</span><span className={s.statLabel}>Offline</span></div>
          <div className={s.statCard}><span className={s.statMuted}>{untested}</span><span className={s.statLabel}>Untested</span></div>
          <div className={s.statCard}><span className={s.statNum}>{connections.length}</span><span className={s.statLabel}>Total</span></div>
        </div>

        {/* ── Content ── */}
        {loading && <div className={s.loadingBar} />}
        {error   && <div className={s.errorBanner}>{error}</div>}

        {!loading && connections.length === 0 && (
          <div className={s.emptyState}>
            <span className={s.emptyIcon}>⬡</span>
            <p>No connections yet. Add your first source database.</p>
          </div>
        )}

        <div className={s.cardsGrid}>
          {connections.map(c => (
            <ConnectionCard key={c.id} connection={c}
              onRetest={handleRetest} onDelete={handleDelete} onSelect={setSelected} />
          ))}
        </div>

        {/* ── Detail panel ── */}
        {selected && (
          <div className={s.detailPanel}>
            <div className={s.detailHeader}>
              <span className={s.detailTitle}>{selected.name}</span>
              <button className={s.btnGhost} onClick={() => setSelected(null)}>✕</button>
            </div>
            <table className={s.detailTable}>
              <tbody>
                <tr><td className={s.detailTdKey}>Type</td><td className={s.detailTd}>{selected.db_type}</td></tr>
                <tr><td className={s.detailTdKey}>Status</td><td className={s.detailTd}>{selected.status}</td></tr>
                <tr>
                  <td className={s.detailTdKey}>Last tested</td>
                  <td className={s.detailTd}>{selected.last_tested ? new Date(selected.last_tested).toLocaleString() : "Never"}</td>
                </tr>
                {Object.entries(selected.config ?? {})
                  .filter(([k]) => k !== "password")
                  .map(([k, v]) => (
                    <tr key={k}><td className={s.detailTdKey}>{k}</td><td className={s.detailTd}>{String(v)}</td></tr>
                  ))}
              </tbody>
            </table>
            <a className={`${s.btnPrimary} ${s.extractLink}`} href={`/extract?connection_id=${selected.id}`}>
              Extract data →
            </a>
          </div>
        )}

        {/* ── Modal ── */}
        {showModal && (
          <AddConnectionModal onClose={() => setShowModal(false)} onSubmit={add} onTest={test} />
        )}
      </div>
    </AuthGuard>
  );
}