// DCP-13 | hooks/useConnections.ts
"use client";
import { useState, useEffect, useCallback } from "react";
import { listConnections, createConnection, testConnection } from "@/services/connections";
import type { Connection, DbType } from "@/types";

export function useConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listConnections();
      setConnections(data);
    } catch {
      setError("Failed to load connections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (
    payload: { name: string; db_type: DbType; config: Record<string, string | number> }
  ) => {
    const conn = await createConnection(payload);
    setConnections(prev => [conn, ...prev]);
    return conn;
  }, []);

  const test = useCallback(async (
    payload: { name: string; db_type: DbType; config: Record<string, string | number> }
  ) => testConnection(payload), []);

  return { connections, loading, error, refresh, add, test };
}