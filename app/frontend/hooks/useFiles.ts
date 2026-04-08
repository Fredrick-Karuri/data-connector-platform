// hooks/useFiles.ts
// Wraps GET /api/files/ and GET /api/files/{id}/download/ (design p.12, p.20)
"use client";
import { useState, useEffect, useCallback } from "react";
import { listFiles, downloadFile } from "@/services/submission";
import type { FileMetadata } from "@/types";

export function useFiles() {
  const [files, setFiles]     = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listFiles();
      setFiles(data);
    } catch {
      setError("Failed to load files.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const download = useCallback(async (fileId: string, format: string, fileName?: string) => {
    try {
      const blob = await downloadFile(fileId);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = fileName ?? `export_${fileId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      throw new Error("Download failed — you may not have permission.");
    }
  }, []);

  return { files, loading, error, refresh, download };
}