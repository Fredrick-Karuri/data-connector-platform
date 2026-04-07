// DCP-14 | hooks/useDiffTracker.ts
// Maintains a DiffMap of cell edits without triggering backend calls per keystroke.
// Design ref: p.8 — Local Diff Tracking
// DiffMap shape: { row_id: { field_name: { old: val, new: val } } }
"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import type { DiffMap, Row } from "@/types";

export interface DiffTrackerResult {
  /** Current in-memory state of all rows (original + edits applied) */
  rows: Row[];
  /** Raw diff map — only changed cells */
  diffMap: DiffMap;
  updateCell: (rowId: string, field: string, value: unknown) => void;
  markDeleted: (rowId: string) => void;
  isDirty: boolean;
  getDirtyRows: () => Row[];
  resetDiffs: () => void;
  getSubmitPayload: () => { original_data: Row[]; modified_data: Row[] };
  rowErrors: Record<string, Record<string, string>>;
  setNullableFields: (fields: string[]) => void;
}

export function useDiffTracker(initialRows: Row[]): DiffTrackerResult {
  // const [originalRows]   = useState<Row[]>(initialRows);
  const [originalRows, setOriginalRows] = useState<Row[]>(initialRows);
  const [diffMap, setDiffMap] = useState<DiffMap>({});
  const [nullableFields, setNullableFields] = useState<string[]>([]);

    useEffect(() => {
    setOriginalRows(initialRows);
    setDiffMap({}); // Reset edits when new data is loaded
  }, [initialRows]);

  // Apply diffs on top of original rows to produce current view
  const rows = useMemo<Row[]>(() => {
    return originalRows.map((row, idx) => {
      const rowId  = _rowId(row, idx);
      const diffs  = diffMap[rowId];
      if (!diffs) return row;
      const merged = { ...row };
      for (const [field, diff] of Object.entries(diffs)) {
        merged[field] = diff.new;
      }
      return merged;
    });
  }, [originalRows, diffMap]);

  const updateCell = useCallback((rowId: string, field: string, value: unknown) => {
    setDiffMap(prev => {
      // Find the original value for this cell
      const rowIdx = _findRowIdx(originalRows, rowId);
      const originalValue = rowIdx >= 0 ? originalRows[rowIdx][field] : undefined;

      // If the new value matches original, remove the diff entry (clean up)
      if (value === originalValue) {
        const next = { ...prev };
        if (next[rowId]) {
          const { [field]: _, ...rest } = next[rowId];
          if (Object.keys(rest).length === 0) {
            delete next[rowId];
          } else {
            next[rowId] = rest;
          }
        }
        return next;
      }

      return {
        ...prev,
        [rowId]: {
          ...(prev[rowId] ?? {}),
          [field]: { old: originalValue, new: value },
        },
      };
    });
  }, [originalRows]);

  const markDeleted = useCallback((rowId: string) => {
    setDiffMap(prev => ({
      ...prev,
      [rowId]: { ...(prev[rowId] ?? {}), _deleted: { old: false, new: true } },
    }));
  }, []);

  const resetDiffs = useCallback(() => setDiffMap({}), []);

  const isDirty = Object.keys(diffMap).length > 0;

  const getDirtyRows = useCallback((): Row[] => {
    return rows.filter((row, idx) => {
      const rowId = _rowId(row, idx);
      return Boolean(diffMap[rowId]);
    });
  }, [rows, diffMap]);

  // Per-field validation for non-nullable fields (design p.8 — Submit blocked if empty)
  const rowErrors = useMemo<Record<string, Record<string, string>>>(() => {
    const errors: Record<string, Record<string, string>> = {};
    rows.forEach((row, idx) => {
      const rowId = _rowId(row, idx);
      const fieldErrors: Record<string, string> = {};
      for (const field of nullableFields) {
        const v = row[field];
        if (v === null || v === undefined || v === "") {
          fieldErrors[field] = `${field} is required`;
        }
      }
      if (Object.keys(fieldErrors).length > 0) {
        errors[rowId] = fieldErrors;
      }
    });
    return errors;
  }, [rows, nullableFields]);

  const getSubmitPayload = useCallback(() => ({
    original_data: originalRows,
    modified_data: rows,
  }), [originalRows, rows]);

  return {
    rows,
    diffMap,
    updateCell,
    markDeleted,
    isDirty,
    getDirtyRows,
    resetDiffs,
    getSubmitPayload,
    rowErrors,
    setNullableFields,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Stable row identity: prefer an `id` field, fall back to index. */
function _rowId(row: Row, idx: number): string {
  return String(row["id"] ?? row["_id"] ?? row["uuid"] ?? `row_${idx}`);
}

function _findRowIdx(rows: Row[], rowId: string): number {
  return rows.findIndex((r, idx) => _rowId(r, idx) === rowId);
}