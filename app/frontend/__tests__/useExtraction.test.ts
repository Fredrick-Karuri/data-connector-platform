// DCP-15 | __tests__/useExtraction.test.ts
// Tests: job initiated, polling transitions, SUCCESS rows populated, FAILED error set
import { renderHook, act, waitFor } from "@testing-library/react";
import { useExtraction } from "@/hooks/useExtraction";

// Mock services at module level
const mockStartExtraction = jest.fn();
const mockPollJob         = jest.fn();

jest.mock("@/services/extraction", () => ({
  startExtraction: (...args: unknown[]) => mockStartExtraction(...args),
  pollJob:         (...args: unknown[]) => mockPollJob(...args),
}));

const ROWS = [
  { id: 1, sku: "SKU-001", price: 49.99 },
  { id: 2, sku: "SKU-002", price: 34.99 },
];

beforeEach(() => {
  mockStartExtraction.mockReset();
  mockPollJob.mockReset();
});

describe("useExtraction", () => {

  it("initialises with empty state", () => {
    const { result } = renderHook(() => useExtraction());
    expect(result.current.state.rows).toEqual([]);
    expect(result.current.state.status).toBeNull();
    expect(result.current.state.loading).toBe(false);
  });

  it("calls startExtraction with correct payload", async () => {
    mockStartExtraction.mockResolvedValue({ job_id: "job-abc-123" });
    mockPollJob.mockResolvedValue({
      status: "SUCCESS", rows: ROWS, result_preview: ROWS,
    });

    const { result } = renderHook(() => useExtraction());
    await act(async () => {
      await result.current.run("conn-1", "SELECT * FROM t", 100);
    });

    expect(mockStartExtraction).toHaveBeenCalledWith({
      connection_id: "conn-1", query: "SELECT * FROM t", batch_size: 100,
    });
  });

  it("populates rows on SUCCESS", async () => {
    mockStartExtraction.mockResolvedValue({ job_id: "job-xyz" });
    mockPollJob.mockImplementation(async (_id: unknown, onProgress: unknown) => {
      (onProgress as (j: unknown) => void)({ status: "PROGRESS", progress: 50 });
      return { status: "SUCCESS", rows: ROWS, result_preview: ROWS };
    });

    const { result } = renderHook(() => useExtraction());
    await act(async () => {
      await result.current.run("conn-1", "SELECT 1", 10);
    });

    expect(result.current.state.status).toBe("SUCCESS");
    expect(result.current.state.rows).toEqual(ROWS);
    expect(result.current.state.progress).toBe(100);
    expect(result.current.state.loading).toBe(false);
  });

  it("sets error on FAILED job", async () => {
    mockStartExtraction.mockResolvedValue({ job_id: "job-fail" });
    mockPollJob.mockRejectedValue({
      status: "FAILED", error_message: "Query syntax error",
    });

    const { result } = renderHook(() => useExtraction());
    await act(async () => {
      await result.current.run("conn-1", "BROKEN SQL !!!", 10);
    });

    expect(result.current.state.status).toBe("FAILED");
    expect(result.current.state.error).toBe("Query syntax error");
    expect(result.current.state.rows).toEqual([]);
    expect(result.current.state.loading).toBe(false);
  });

  it("onProgress callback updates progress mid-poll", async () => {
    mockStartExtraction.mockResolvedValue({ job_id: "job-prog" });
    mockPollJob.mockImplementation(async (_id: unknown, onProgress: unknown) => {
      (onProgress as (j: unknown) => void)({ status: "PROGRESS", progress: 25 });
      (onProgress as (j: unknown) => void)({ status: "PROGRESS", progress: 75 });
      return { status: "SUCCESS", rows: ROWS, result_preview: ROWS };
    });

    const { result } = renderHook(() => useExtraction());
    await act(async () => {
      await result.current.run("conn-1", "SELECT 1", 10);
    });

    expect(result.current.state.progress).toBe(100);
    expect(result.current.state.rows).toHaveLength(2);
  });

  it("reset() clears all state", async () => {
    mockStartExtraction.mockResolvedValue({ job_id: "job-reset" });
    mockPollJob.mockResolvedValue({
      status: "SUCCESS", rows: ROWS, result_preview: ROWS,
    });

    const { result } = renderHook(() => useExtraction());
    await act(async () => { await result.current.run("conn-1", "SELECT 1", 10); });
    expect(result.current.state.rows).toHaveLength(2);

    act(() => { result.current.reset(); });
    expect(result.current.state.rows).toEqual([]);
    expect(result.current.state.status).toBeNull();
    expect(result.current.state.jobId).toBeNull();
  });
});