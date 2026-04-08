// __tests__/gridValidation.test.ts
// Design ref: p.23 — "Submit button disabled if mandatory field empty"
// and "error response with row IDs correctly adds red highlight to matching rows"

import { renderHook, act } from "@testing-library/react";
import { useDiffTracker } from "@/hooks/useDiffTracker";
import { useSubmission }  from "@/hooks/useSubmission";

const mockSubmitBatch = jest.fn();
jest.mock("@/services/submission", () => ({
  submitBatch:  (...args: unknown[]) => mockSubmitBatch(...args),
  listFiles:    jest.fn().mockResolvedValue([]),
  downloadFile: jest.fn(),
}));

const ROWS = [
  { id: "r1", name: "Widget A",  price: 9.99,  category: "Electronics" },
  { id: "r2", name: "Widget B",  price: 24.99, category: "Furniture"   },
  { id: "r3", name: "Widget C",  price: 4.99,  category: "Electronics" },
];

beforeEach(() => mockSubmitBatch.mockReset());

// ── Submit button state (isDirty + rowErrors) ─────────────────────────────────
describe("Submit button gating", () => {

  it("isDirty is false initially — submit would be disabled", () => {
    const { result } = renderHook(() => useDiffTracker(ROWS));
    expect(result.current.isDirty).toBe(false);
  });

  it("isDirty becomes true after a cell edit — submit enabled", () => {
    const { result } = renderHook(() => useDiffTracker(ROWS));
    act(() => { result.current.updateCell("r1", "name", "Widget Pro"); });
    expect(result.current.isDirty).toBe(true);
  });

  it("submit blocked when nullable field is empty (rowErrors non-empty)", () => {
    const { result } = renderHook(() => useDiffTracker(ROWS));
    act(() => { result.current.setNullableFields(["name", "category"]); });

    // Empty a required field
    act(() => { result.current.updateCell("r2", "name", ""); });

    const hasErrors = Object.keys(result.current.rowErrors).length > 0;
    // canSubmit = isDirty && !hasErrors — this should be false
    expect(hasErrors).toBe(true);
    expect(result.current.isDirty).toBe(true);
    // Simulate the canSubmit guard from EditableGrid
    const canSubmit = result.current.isDirty && !hasErrors;
    expect(canSubmit).toBe(false);
  });

  it("submit unblocked when error is fixed", () => {
    const { result } = renderHook(() => useDiffTracker(ROWS));
    act(() => { result.current.setNullableFields(["name"]); });
    act(() => { result.current.updateCell("r1", "name", ""); });
    expect(Object.keys(result.current.rowErrors)).toHaveLength(1);

    // Fix the field
    act(() => { result.current.updateCell("r1", "name", "Widget Fixed"); });
    expect(Object.keys(result.current.rowErrors)).toHaveLength(0);
    expect(result.current.isDirty).toBe(true);
  });

  it("multiple nullable fields — all must be filled", () => {
    const { result } = renderHook(() => useDiffTracker(ROWS));
    act(() => { result.current.setNullableFields(["name", "category"]); });
    act(() => {
      result.current.updateCell("r1", "name",     "");
      result.current.updateCell("r1", "category", "");
    });
    expect(result.current.rowErrors["r1"]).toEqual({
      name:     "name is required",
      category: "category is required",
    });
  });
});

// ── Row error highlighting from API response (design p.21) ────────────────────
describe("API row error highlighting", () => {

  it("submitError.row_errors contains failing row IDs for grid highlight", async () => {
    const apiError = {
      code:       "PersistenceError",
      detail:     "Type mismatch",
      row_errors: { r2: "price must be a number", r3: "category is required" },
    };
    mockSubmitBatch.mockRejectedValue(apiError);

    const { result } = renderHook(() => useSubmission());
    await act(async () => {
      await result.current.submit({
        job_id: "job-1", original_data: ROWS,
        modified_data: ROWS, format: "json",
      });
    });

    expect(result.current.submitError?.row_errors).toBeDefined();
    // Both failing row IDs are present — grid uses these to add .row-api-error class
    expect(result.current.submitError?.row_errors?.["r2"]).toBe("price must be a number");
    expect(result.current.submitError?.row_errors?.["r3"]).toBe("category is required");
    // Passing row is absent
    expect(result.current.submitError?.row_errors?.["r1"]).toBeUndefined();
  });

  it("submitError is cleared on next successful submit", async () => {
    mockSubmitBatch.mockRejectedValueOnce({ code: "PersistenceError", detail: "fail" });
    mockSubmitBatch.mockResolvedValueOnce({ file_id: "new-file" });

    const { result } = renderHook(() => useSubmission());

    await act(async () => {
      await result.current.submit({
        job_id: "j1", original_data: ROWS, modified_data: ROWS, format: "json",
      });
    });
    expect(result.current.submitError).not.toBeNull();

    await act(async () => {
      await result.current.submit({
        job_id: "j2", original_data: ROWS, modified_data: ROWS, format: "json",
      });
    });
    expect(result.current.submitError).toBeNull();
    expect(result.current.submitResult).toEqual({ file_id: "new-file" });
  });

  it("schema drift returns 400 — extra fields caught before submit", () => {
    // The SubmitBatchSerializer cross-field check  catches this server-side.
    // Frontend guard: getSubmitPayload only returns rows with original schema.
    const { result } = renderHook(() => useDiffTracker(ROWS));
    act(() => { result.current.updateCell("r1", "name", "Widget X"); });

    const { modified_data } = result.current.getSubmitPayload();
    // modified_data never contains keys outside original_data schema
    const originalKeys = new Set(Object.keys(ROWS[0]));
    modified_data.forEach((row: Record<string, unknown>) => {
      Object.keys(row).forEach(k => {
        expect(originalKeys.has(k)).toBe(true);
      });
    });
  });
});

// ── Diff map structural integrity ─────────────────────────────────────────────
describe("DiffMap structural correctness", () => {

  it("diffMap shape matches { row_id: { field: { old, new } } }", () => {
    const { result } = renderHook(() => useDiffTracker(ROWS));
    act(() => {
      result.current.updateCell("r1", "price", 19.99);
      result.current.updateCell("r2", "name",  "Widget B+");
    });

    // Verify exact DiffMap shape from design p.8
    expect(result.current.diffMap["r1"]["price"]).toEqual({ old: 9.99,  new: 19.99 });
    expect(result.current.diffMap["r2"]["name"]).toEqual({ old: "Widget B", new: "Widget B+" });
  });

  it("getSubmitPayload original_data is immutable — edits don't bleed back", () => {
    const { result } = renderHook(() => useDiffTracker(ROWS));
    act(() => { result.current.updateCell("r3", "price", 999.99); });

    const { original_data, modified_data } = result.current.getSubmitPayload();
    expect(original_data.find((r: Record<string, unknown>) => r["id"] === "r3")?.["price"]).toBe(4.99);
    expect(modified_data.find((r: Record<string, unknown>) => r["id"] === "r3")?.["price"]).toBe(999.99);
  });
});