"use client";
import { s } from "@/styles/connections";
import type { Connection } from "@/types";

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
    <div style={{ borderLeft: `3px solid ${accent}` }} className={s.card} onClick={() => onSelect(connection)}>
      <div className={s.cardTop}>
        <span className={s.dbBadge} style={{ color: accent }}>{DB_LABELS[connection.db_type]}</span>
        <span className={isHealthy ? s.statusHealthy : s.statusOffline} />
      </div>
      <p className={s.connName}>{connection.name}</p>
      <div className={s.cardMeta}>
        {connection.last_tested && (
          <span className={s.metaText}>Tested {new Date(connection.last_tested).toLocaleTimeString()}</span>
        )}
        <div className={s.cardActions} onClick={e => e.stopPropagation()}>
          <button className={s.btnGhost} onClick={() => onRetest(connection.id)}>↺ Retest</button>
          <button className={s.btnGhostDanger} onClick={() => onDelete(connection.id)}>✕</button>
        </div>
      </div>
    </div>
  );
}