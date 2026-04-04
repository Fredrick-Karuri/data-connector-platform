// DCP-13 | components/ConnectionCard.tsx
"use client";
import { Connection } from "@/types";

const DB_LABELS: Record<string, string> = {
  postgres: "PostgreSQL", mysql: "MySQL",
  mongodb: "MongoDB", clickhouse: "ClickHouse",
};

const DB_COLOR: Record<string, string> = {
  postgres: "#336791", mysql: "#00758f",
  mongodb: "#00684a", clickhouse: "#facc15",
};

interface Props {
  connection: Connection;
  onRetest: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (c: Connection) => void;
}

export function ConnectionCard({ connection, onRetest, onDelete, onSelect }: Props) {
  const isHealthy = connection.status === "Healthy";
  const accent    = DB_COLOR[connection.db_type] ?? "#888";

  return (
    <div
      style={{ borderLeft: `3px solid ${accent}` }}
      className="dcp-card"
      onClick={() => onSelect(connection)}
    >
      <div className="card-top">
        <span className="db-badge" style={{ color: accent }}>
          {DB_LABELS[connection.db_type]}
        </span>
        <span className={`status-dot ${isHealthy ? "healthy" : "offline"}`} />
      </div>

      <p className="conn-name">{connection.name}</p>

      <div className="card-meta">
        {connection.last_tested && (
          <span className="meta-text">
            Tested {new Date(connection.last_tested).toLocaleTimeString()}
          </span>
        )}
        <div className="card-actions" onClick={e => e.stopPropagation()}>
          <button className="btn-ghost" onClick={() => onRetest(connection.id)}>
            ↺ Retest
          </button>
          <button className="btn-ghost danger" onClick={() => onDelete(connection.id)}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}