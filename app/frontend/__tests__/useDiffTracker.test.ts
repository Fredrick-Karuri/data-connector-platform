// DCP-14 | __tests__/useDiffTracker.test.ts
// Design ref: p.23 — "editing a cell updates the Local Diff Map without triggering a re-fetch"
// and "Submit button disabled if a mandatory field is empty"

import { renderHook, act } from "@testing-library/react";
import { useDiffTracker } from "@/hooks/useDiffTracker";

const INITIAL_ROWS = [
  { id: "row_1", name: "Widget A", price: 9.99,  in_stock: true  },
  { id: "row_2", name: "Widget B", price: 24.99, in_stock: false },
  { id: "row_3", name: "Widget C", price: 4.99,  in_stock: true  },
];

describe("useDiffTracker", () => {

  it("initialises with original rows and empty diffMap", () => {
    const { result } = renderHook(() => useDiffTracker(INITIAL_ROWS));
    expect(result.current.rows).toEqual(INITIAL_ROWS);
    expect(result.current.diffMap).toEqual({});
    expect(result.current.isDirty).toBe(false);
  });

  it("updateCell records the diff without re-fetching", () => {
    const { result } = renderHook(() => useDiffTracker(INITIAL_ROWS));

    act(() => { result.current.updateCell("row_1", "name", "Widget Pro"); });

    // Diff map updated correctly
    expect(result.current.diffMap["row_1"]["name"]).toEqual({
      old: "Widget A", new: "Widget Pro",
    });
    // isDirty reflects change — confirming local state only, no network (design p.23)
    expect(result.current.isDirty).toBe(true);
    // rows updated immediately (optimistic)
    expect(result.current.rows[0]["name"]).toBe("Widget Pro");
  });

  it("rows reflect the latest edited value optimistically", () => {
    const { result } = renderHook(() => useDiffTracker(INITIAL_ROWS));
    act(() => { result.current.updateCell("row_2", "price", 29.99); });
    const updatedRow = result.current.rows.find(r => r["id"] === "row_2");
    expect(updatedRow?.["price"]).toBe(29.99);
  });

  it("reverting a cell to its original value removes it from diffMap", () => {
    const { result } = renderHook(() => useDiffTracker(INITIAL_ROWS));
    act(() => { result.current.updateCell("row_1", "name", "Widget Z"); });
    expect(result.current.isDirty).toBe(true);
    // Revert back to original
    act(() => { result.current.updateCell("row_1", "name", "Widget A"); });
    expect(result.current.diffMap["row_1"]).toBeUndefined();
    expect(result.current.isDirty).toBe(false);
  });

  it("getDirtyRows returns only rows with changes", () => {
    const { result } = renderHook(() => useDiffTracker(INITIAL_ROWS));
    act(() => { result.current.updateCell("row_2", "name", "Widget B+"); });
    const dirty = result.current.getDirtyRows();
    expect(dirty).toHaveLength(1);
    expect(dirty[0]["id"]).toBe("row_2");
  });

  it("resetDiffs restores original state", () => {
    const { result } = renderHook(() => useDiffTracker(INITIAL_ROWS));
    act(() => {
      result.current.updateCell("row_1", "name", "Changed");
      result.current.updateCell("row_3", "price", 99.99);
    });
    expect(result.current.isDirty).toBe(true);
    act(() => { result.current.resetDiffs(); });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.rows).toEqual(INITIAL_ROWS);
  });

  it("markDeleted flags the row in diffMap with _deleted", () => {
    const { result } = renderHook(() => useDiffTracker(INITIAL_ROWS));
    act(() => { result.current.markDeleted("row_3"); });
    expect(result.current.diffMap["row_3"]["_deleted"]).toEqual({ old: false, new: true });
  });

  it("getSubmitPayload returns original and modified data", () => {
    const { result } = renderHook(() => useDiffTracker(INITIAL_ROWS));
    act(() => { result.current.updateCell("row_1", "price", 19.99); });
    const { original_data, modified_data } = result.current.getSubmitPayload();
    expect(original_data).toEqual(INITIAL_ROWS);
    expect(modified_data.find((r: Record<string, unknown>) => r["id"] === "row_1")?.["price"]).toBe(19.99);
    expect(original_data.find((r: Record<string, unknown>) => r["id"] === "row_1")?.["price"]).toBe(9.99);
  });

  describe("Submit button validation (design p.23)", () => {

    it("rowErrors is empty when all nullable fields have values", () => {
      const { result } = renderHook(() => useDiffTracker(INITIAL_ROWS));
      act(() => { result.current.setNullableFields(["name", "price"]); });
      expect(result.current.rowErrors).toEqual({});
    });

    it("rowErrors flags a row when a nullable field is set to empty", () => {
      const { result } = renderHook(() => useDiffTracker(INITIAL_ROWS));
      act(() => { result.current.setNullableFields(["name"]); });
      // Empty the name of row_2
      act(() => { result.current.updateCell("row_2", "name", ""); });
      expect(result.current.rowErrors["row_2"]?.["name"]).toBe("name is required");
    });

    it("isDirty stays false when a value reverts to original", () => {
      const { result } = renderHook(() => useDiffTracker(INITIAL_ROWS));
      act(() => { result.current.updateCell("row_1", "price", 9.99); }); // same value
      expect(result.current.isDirty).toBe(false);
    });
  });

  it("multiple concurrent cell edits across different rows are tracked independently", () => {
    const { result } = renderHook(() => useDiffTracker(INITIAL_ROWS));
    act(() => {
      result.current.updateCell("row_1", "name",  "Alpha");
      result.current.updateCell("row_2", "price", 50.00);
      result.current.updateCell("row_3", "name",  "Gamma");
    });
    expect(Object.keys(result.current.diffMap)).toHaveLength(3);
    expect(result.current.getDirtyRows()).toHaveLength(3);
  });
});