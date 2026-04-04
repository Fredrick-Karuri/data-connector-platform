// DCP-14 | components/EditableGrid.tsx
// TanStack Table with inline cell editing, optimistic updates, diff highlighting.
// Design ref: p.8 — TanStack Table, Optimistic UI, Local Diff Tracking
"use client";
import { useMemo, useCallback, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import type { Row, DiffMap, ApiError } from "@/types";
import type { DiffTrackerResult } from "@/hooks/useDiffTracker";

interface Props {
  tracker:      DiffTrackerResult;
  onSubmit:     () => Promise<void>;
  submitting:   boolean;
  submitError:  ApiError | null;
  format:       "csv" | "json";
  onFormatChange: (f: "csv" | "json") => void;
}

// Infer cell editor type from value
function inferType(value: unknown): "boolean" | "number" | "text" {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number")  return "number";
  return "text";
}

export function EditableGrid({
  tracker, onSubmit, submitting, submitError, format, onFormatChange,
}: Props) {
  const { rows, diffMap, rowErrors, isDirty, updateCell, markDeleted, resetDiffs } = tracker;
  const [sorting, setSorting]           = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Derive column definitions dynamically from first row
  const columns = useMemo<ColumnDef<Row>[]>(() => {
    if (!rows.length) return [];

    const dataColumns: ColumnDef<Row>[] = Object.keys(rows[0])
      .filter(k => k !== "_deleted")
      .map(field => ({
        accessorKey: field,
        header: field,
        cell: ({ row, getValue }) => {
          const rowIdx  = row.index;
          const rowId   = String(rows[rowIdx]?.["id"] ?? rows[rowIdx]?.["_id"] ?? `row_${rowIdx}`);
          const value   = getValue();
          const isDirtyCell = Boolean(diffMap[rowId]?.[field]);
          const fieldError  = rowErrors[rowId]?.[field];
          const type    = inferType(rows[0][field]);

          return (
            <EditableCell
              rowId={rowId}
              field={field}
              value={value}
              type={type}
              isDirty={isDirtyCell}
              error={fieldError}
              onUpdate={updateCell}
            />
          );
        },
      }));

    // Row actions column
    dataColumns.push({
      id: "_actions",
      header: "",
      size: 48,
      cell: ({ row }) => {
        const rowIdx = row.index;
        const rowId  = String(rows[rowIdx]?.["id"] ?? rows[rowIdx]?.["_id"] ?? `row_${rowIdx}`);
        const isDeleted = Boolean(diffMap[rowId]?.["_deleted"]);
        return (
          <button
            className={`row-delete-btn ${isDeleted ? "deleted" : ""}`}
            onClick={() => markDeleted(rowId)}
            title={isDeleted ? "Marked for deletion" : "Mark for deletion"}
          >
            {isDeleted ? "↩" : "✕"}
          </button>
        );
      },
    });

    return dataColumns;
  }, [rows, diffMap, rowErrors, updateCell, markDeleted]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const hasErrors    = Object.keys(rowErrors).length > 0;
  const dirtyCount   = Object.keys(diffMap).length;
  const canSubmit    = isDirty && !hasErrors && !submitting;

  // Row-level error highlighting from API response (design p.21)
  const apiRowErrors = useMemo<Set<string>>(() => {
    if (!submitError?.row_errors) return new Set();
    return new Set(Object.keys(submitError.row_errors));
  }, [submitError]);

  return (
    <div className="grid-container">
      {/* ── Toolbar ── */}
      <div className="grid-toolbar">
        <div className="toolbar-left">
          <input
            className="grid-search"
            placeholder="Filter rows…"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
          />
          <span className="row-count">
            {table.getFilteredRowModel().rows.length} / {rows.length} rows
            {dirtyCount > 0 && <span className="dirty-badge">{dirtyCount} edited</span>}
          </span>
        </div>
        <div className="toolbar-right">
          {isDirty && (
            <button className="btn-ghost" onClick={resetDiffs}>Reset</button>
          )}
          <select
            className="format-select"
            value={format}
            onChange={e => onFormatChange(e.target.value as "csv" | "json")}
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
          <button
            className="btn-submit"
            onClick={onSubmit}
            disabled={!canSubmit}
            title={hasErrors ? "Fix required fields first" : ""}
          >
            {submitting ? "Submitting…" : "Submit ↗"}
          </button>
        </div>
      </div>

      {/* ── Error banner from API (design p.21 — row-level highlighting) ── */}
      {submitError && (
        <div className="api-error-banner">
          <strong>{submitError.code}:</strong> {submitError.detail}
        </div>
      )}

      {/* ── Table ── */}
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: header.column.getCanSort() ? "pointer" : "default", width: header.getSize() }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc"  && " ↑"}
                    {header.column.getIsSorted() === "desc" && " ↓"}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => {
              const rowId    = String(rows[row.index]?.["id"] ?? rows[row.index]?.["_id"] ?? `row_${row.index}`);
              const isEdited  = Boolean(diffMap[rowId]);
              const isDeleted = Boolean(diffMap[rowId]?.["_deleted"]);
              const hasApiErr = apiRowErrors.has(rowId);
              return (
                <tr
                  key={row.id}
                  className={[
                    isDeleted ? "row-deleted" : "",
                    isEdited  ? "row-dirty"   : "",
                    hasApiErr ? "row-api-error" : "",
                  ].filter(Boolean).join(" ")}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Inline cell editor ────────────────────────────────────────────────────────

interface CellProps {
  rowId:    string;
  field:    string;
  value:    unknown;
  type:     "boolean" | "number" | "text";
  isDirty:  boolean;
  error?:   string;
  onUpdate: (rowId: string, field: string, value: unknown) => void;
}

function EditableCell({ rowId, field, value, type, isDirty, error, onUpdate }: CellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(String(value ?? ""));

  const commit = useCallback(() => {
    setEditing(false);
    let parsed: unknown = draft;
    if (type === "number")  parsed = Number(draft);
    if (type === "boolean") parsed = draft === "true";
    // Optimistic update — no network call (design p.8)
    onUpdate(rowId, field, parsed);
  }, [draft, type, rowId, field, onUpdate]);

  const cellClass = [
    "data-cell",
    isDirty ? "cell-dirty"  : "",
    error   ? "cell-error"  : "",
  ].filter(Boolean).join(" ");

  if (type === "boolean") {
    return (
      <td className={cellClass}>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={e => onUpdate(rowId, field, e.target.checked)}
          className="cell-checkbox"
        />
      </td>
    );
  }

  if (editing) {
    return (
      <td className={cellClass + " editing"}>
        <input
          autoFocus
          className="cell-input"
          type={type === "number" ? "number" : "text"}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        />
        {error && <span className="cell-error-msg">{error}</span>}
      </td>
    );
  }

  return (
    <td className={cellClass} onDoubleClick={() => { setDraft(String(value ?? "")); setEditing(true); }}>
      <span className="cell-value">{String(value ?? "")}</span>
      {error && <span className="cell-error-msg">{error}</span>}
    </td>
  );
}