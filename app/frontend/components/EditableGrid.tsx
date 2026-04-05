// components/EditableGrid.tsx
// TanStack Table with inline cell editing, optimistic updates, diff highlighting.
// Design ref: p.8 — TanStack Table, Optimistic UI, Local Diff Tracking
"use client";
import { useMemo, useCallback, useState } from "react";
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, flexRender,
  type ColumnDef, type SortingState, type ColumnFiltersState,
} from "@tanstack/react-table";
import { grid as g } from "@/styles/components";
import type { Row, ApiError } from "@/types";
import type { DiffTrackerResult } from "@/hooks/useDiffTracker";

interface Props {
  tracker:        DiffTrackerResult;
  onSubmit:       () => Promise<void>;
  submitting:     boolean;
  submitError:    ApiError | null;
  format:         "csv" | "json";
  onFormatChange: (f: "csv" | "json") => void;
}

function inferType(value: unknown): "boolean" | "number" | "text" {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number")  return "number";
  return "text";
}

export function EditableGrid({ tracker, onSubmit, submitting, submitError, format, onFormatChange }: Props) {
  const { rows, diffMap, rowErrors, isDirty, updateCell, markDeleted, resetDiffs } = tracker;
  const [sorting, setSorting]               = useState<SortingState>([]);
  const [columnFilters, setColumnFilters]   = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter]     = useState("");

  const columns = useMemo<ColumnDef<Row>[]>(() => {
    if (!rows.length) return [];
    const dataColumns: ColumnDef<Row>[] = Object.keys(rows[0])
      .filter(k => k !== "_deleted")
      .map(field => ({
        accessorKey: field,
        header: field,
        cell: ({ row, getValue }) => {
          const rowIdx = row.index;
          const rowId  = String(rows[rowIdx]?.["id"] ?? rows[rowIdx]?.["_id"] ?? `row_${rowIdx}`);
          return (
            <EditableCell
              rowId={rowId} field={field} value={getValue()}
              type={inferType(rows[0][field])}
              isDirty={Boolean(diffMap[rowId]?.[field])}
              error={rowErrors[rowId]?.[field]}
              onUpdate={updateCell}
            />
          );
        },
      }));

    dataColumns.push({
      id: "_actions", header: "", size: 48,
      cell: ({ row }) => {
        const rowId     = String(rows[row.index]?.["id"] ?? rows[row.index]?.["_id"] ?? `row_${row.index}`);
        const isDeleted = Boolean(diffMap[rowId]?.["_deleted"]);
        return (
          <button className={isDeleted ? g.deleteBtnOn : g.deleteBtn}
            onClick={() => markDeleted(rowId)}
            title={isDeleted ? "Marked for deletion" : "Mark for deletion"}>
            {isDeleted ? "↩" : "✕"}
          </button>
        );
      },
    });
    return dataColumns;
  }, [rows, diffMap, rowErrors, updateCell, markDeleted]);

  const table = useReactTable({
    data: rows, columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const hasErrors  = Object.keys(rowErrors).length > 0;
  const dirtyCount = Object.keys(diffMap).length;
  const canSubmit  = isDirty && !hasErrors && !submitting;

  const apiRowErrors = useMemo<Set<string>>(() => {
    if (!submitError?.row_errors) return new Set();
    return new Set(Object.keys(submitError.row_errors));
  }, [submitError]);

  return (
    <div className={g.container}>
      {/* ── Toolbar ── */}
      <div className={g.toolbar}>
        <div className={g.toolbarLeft}>
          <input className={g.search} placeholder="Filter rows…"
            value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} />
          <span className={g.rowCount}>
            {table.getFilteredRowModel().rows.length} / {rows.length} rows
            {dirtyCount > 0 && <span className={g.dirtyBadge}>{dirtyCount} edited</span>}
          </span>
        </div>
        <div className={g.toolbarRight}>
          {isDirty && <button className={g.btnGhost} onClick={resetDiffs}>Reset</button>}
          <select className={g.formatSelect} value={format}
            onChange={e => onFormatChange(e.target.value as "csv" | "json")}>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
          <button className={g.btnSubmit} onClick={onSubmit} disabled={!canSubmit}
            title={hasErrors ? "Fix required fields first" : ""}>
            {submitting ? "Submitting…" : "Submit ↗"}
          </button>
        </div>
      </div>

      {submitError && (
        <div className={g.apiError}><strong>{submitError.code}:</strong> {submitError.detail}</div>
      )}

      {/* ── Table ── */}
      <div className={g.tableScroll}>
        <table className={g.table}>
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(header => (
                  <th key={header.id} className={g.th}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: header.column.getCanSort() ? "pointer" : "default", width: header.getSize() }}>
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
              const rowId     = String(rows[row.index]?.["id"] ?? rows[row.index]?.["_id"] ?? `row_${row.index}`);
              const isEdited  = Boolean(diffMap[rowId]);
              const isDeleted = Boolean(diffMap[rowId]?.["_deleted"]);
              const hasApiErr = apiRowErrors.has(rowId);
              const rowClass  = isDeleted ? g.rowDeleted : hasApiErr ? g.rowApiError : isEdited ? g.rowDirty : g.rowBase;
              return (
                <tr key={row.id} className={rowClass}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
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

interface CellProps {
  rowId: string; field: string; value: unknown;
  type: "boolean" | "number" | "text";
  isDirty: boolean; error?: string;
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
    onUpdate(rowId, field, parsed);
  }, [draft, type, rowId, field, onUpdate]);

  const cellClass = error ? g.cellError : isDirty ? g.cellDirty : g.cell;

  if (type === "boolean") {
    return (
      <td className={cellClass}>
        <input type="checkbox" checked={Boolean(value)} className={g.cellCheckbox}
          onChange={e => onUpdate(rowId, field, e.target.checked)} />
      </td>
    );
  }

  if (editing) {
    return (
      <td className={cellClass}>
        <input autoFocus className={g.cellInput}
          type={type === "number" ? "number" : "text"}
          value={draft} onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }} />
        {error && <span className={g.cellErrorMsg}>{error}</span>}
      </td>
    );
  }

  return (
    <td className={cellClass} onDoubleClick={() => { setDraft(String(value ?? "")); setEditing(true); }}>
      <span className={g.cellValue}>{String(value ?? "")}</span>
      {error && <span className={g.cellErrorMsg}>{error}</span>}
    </td>
  );
}