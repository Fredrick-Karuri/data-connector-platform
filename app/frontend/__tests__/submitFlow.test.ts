// DCP-16 | __tests__/submitFlow.test.ts
// Tests: submit sends correct payload, row error highlighting on 400,
// file list renders, download triggered. Design ref: p.15, p.21, p.23.

import { renderHook, act } from "@testing-library/react";
import { useSubmission } from "@/hooks/useSubmission";
import { useFiles }      from "@/hooks/useFiles";

// ── Mock services ─────────────────────────────────────────────────────────────
const mockSubmitBatch = jest.fn();
const mockListFiles   = jest.fn();
const mockDownload    = jest.fn();

jest.mock("@/services/submission", () => ({
  submitBatch:  (...args: unknown[]) => mockSubmitBatch(...args),
  listFiles:    (...args: unknown[]) => mockListFiles(...args),
  downloadFile: (...args: unknown[]) => mockDownload(...args),
}));

const ORIGINAL = [{ id: "r1", name: "Widget A", price: 9.99 }];
const MODIFIED = [{ id: "r1", name: "Widget Pro", price: 14.99 }];

const FILE_LIST = [
  {
    file_id: "file-uuid-1234",
    format: "json",
    owner: { id: "u1", username: "alice", role: "user" },
    source_metadata: { source_db: "Main PG", rows_total: 100 },
    checksum: "abc123def456abc1",
    created_at: new Date().toISOString(),
  },
  {
    file_id: "file-uuid-5678",
    format: "csv",
    owner: { id: "u1", username: "alice", role: "user" },
    source_metadata: { source_db: "MySQL CRM", rows_total: 15 },
    checksum: "xyz789uvw012xyz7",
    created_at: new Date().toISOString(),
  },
];

beforeEach(() => {
  mockSubmitBatch.mockReset();
  mockListFiles.mockReset();
  mockDownload.mockReset();
});

// ── useSubmission tests ───────────────────────────────────────────────────────
describe("useSubmission", () => {

  it("initialises with empty state", () => {
    const { result } = renderHook(() => useSubmission());
    expect(result.current.submitting).toBe(false);
    expect(result.current.submitError).toBeNull();
    expect(result.current.submitResult).toBeNull();
  });

  it("calls submitBatch with correct payload and returns file_id", async () => {
    mockSubmitBatch.mockResolvedValue({ file_id: "file-abc-123" });
    const { result } = renderHook(() => useSubmission());

    await act(async () => {
      await result.current.submit({
        job_id: "job-xyz", original_data: ORIGINAL,
        modified_data: MODIFIED, format: "json",
      });
    });

    expect(mockSubmitBatch).toHaveBeenCalledWith({
      job_id: "job-xyz", original_data: ORIGINAL,
      modified_data: MODIFIED, format: "json",
    });
    expect(result.current.submitResult).toEqual({ file_id: "file-abc-123" });
    expect(result.current.submitError).toBeNull();
    expect(result.current.submitting).toBe(false);
  });

  it("sets submitError on API failure with row_errors (design p.21)", async () => {
    const apiError = {
      code: "PersistenceError",
      detail: "Type mismatch on row r1",
      row_errors: { r1: "price must be a number" },
    };
    mockSubmitBatch.mockRejectedValue(apiError);
    const { result } = renderHook(() => useSubmission());

    await act(async () => {
      await result.current.submit({
        job_id: "job-fail", original_data: ORIGINAL,
        modified_data: MODIFIED, format: "csv",
      });
    });

    expect(result.current.submitError).toEqual(apiError);
    expect(result.current.submitResult).toBeNull();
    // row_errors available for grid to highlight affected rows
    expect(result.current.submitError?.row_errors?.["r1"]).toBe("price must be a number");
  });

  it("sets submitting=true during inflight request", async () => {
    let resolve!: (v: unknown) => void;
    mockSubmitBatch.mockReturnValue(new Promise(r => { resolve = r; }));
    const { result } = renderHook(() => useSubmission());

    act(() => {
      result.current.submit({
        job_id: "job-slow", original_data: ORIGINAL,
        modified_data: MODIFIED, format: "json",
      });
    });

    expect(result.current.submitting).toBe(true);
    await act(async () => { resolve({ file_id: "done" }); });
    expect(result.current.submitting).toBe(false);
  });
});

// ── useFiles tests ────────────────────────────────────────────────────────────
describe("useFiles", () => {

  it("loads file list on mount", async () => {
    mockListFiles.mockResolvedValue(FILE_LIST);
    const { result } = renderHook(() => useFiles());

    // loading starts true
    expect(result.current.loading).toBe(true);

    await act(async () => {});  // wait for effect

    expect(result.current.files).toHaveLength(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets error on listFiles failure", async () => {
    mockListFiles.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useFiles());

    await act(async () => {});

    expect(result.current.error).toBe("Failed to load files.");
    expect(result.current.files).toHaveLength(0);
  });

  it("download() calls downloadFile and triggers browser save", async () => {
    mockListFiles.mockResolvedValue(FILE_LIST);
    mockDownload.mockResolvedValue(new Blob(["test"], { type: "application/json" }));

    // Mock URL APIs only
    const mockClick     = jest.fn();
    const mockRevoke    = jest.fn();
    const mockCreateURL = jest.fn().mockReturnValue("blob:mock-url");
    global.URL.createObjectURL = mockCreateURL;
    global.URL.revokeObjectURL = mockRevoke;

    // Intercept only the anchor element created by download()
    const realCreate = document.createElement.bind(document);
    const mockAnchor = { href: "", download: "", click: mockClick } as unknown as HTMLAnchorElement;
    jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") return mockAnchor;
      return realCreate(tag);
    });

    const { result } = renderHook(() => useFiles());
    await act(async () => {});

    await act(async () => {
      await result.current.download("file-uuid-1234", "json", "export.json");
    });

    expect(mockDownload).toHaveBeenCalledWith("file-uuid-1234");
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevoke).toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  it("download() throws on API error (403 RBAC)", async () => {
    mockListFiles.mockResolvedValue(FILE_LIST);
    mockDownload.mockRejectedValue({ status: 403, detail: "Forbidden" });

    // Same anchor intercept
    const realCreate = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") return { href: "", download: "", click: jest.fn() } as unknown as HTMLAnchorElement;
      return realCreate(tag);
    });

    const { result } = renderHook(() => useFiles());
    await act(async () => {});

    let caught: Error | null = null;
    await act(async () => {
      try {
        await result.current.download("file-uuid-1234", "json");
      } catch (e) {
        caught = e as Error;
      }
    });

    expect(caught).not.toBeNull();
    expect((caught as unknown as Error).message).toBe("Download failed — you may not have permission.");

    jest.restoreAllMocks();
  });
});