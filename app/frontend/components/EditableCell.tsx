"use client";
import {useCallback, useState } from "react";
import { grid as g } from "@/styles/components";

interface CellProps {
  rowId: string;
  field: string;
  value: unknown;
  type: "boolean" | "number" | "text";
  isDirty: boolean;
  error?: string;
  onUpdate: (rowId: string, field: string, value: unknown) => void;
}
export function EditableCell({
  rowId,
  field,
  value,
  type,
  isDirty,
  error,
  onUpdate,
}: CellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? ""));

  const commit = useCallback(() => {
    setEditing(false);
    let parsed: unknown = draft;
    if (type === "number") parsed = Number(draft);
    if (type === "boolean") parsed = draft === "true";
    onUpdate(rowId, field, parsed);
  }, [draft, type, rowId, field, onUpdate]);

  const cellClass = error ? g.cellError : isDirty ? g.cellDirty : g.cell;

  if (type === "boolean") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        className={g.cellCheckbox}
        onChange={(e) => onUpdate(rowId, field, e.target.checked)}
      />
    );
  }

  if (editing) {
    return (
      <>
        <input
          autoFocus
          className={g.cellInput}
          type={type === "number" ? "number" : "text"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        {error && <span className={g.cellErrorMsg}>{error}</span>}
      </>
    );
  }

  return (
    <span
      onDoubleClick={() => {
        setDraft(String(value ?? ""));
        setEditing(true);
      }}
    >
      <span className={g.cellValue}>{String(value ?? "")}</span>
      {error && <span className={g.cellErrorMsg}>{error}</span>}
    </span>
  );
}
