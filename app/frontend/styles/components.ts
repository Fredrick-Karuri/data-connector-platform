// ── NavBar ────────────────────────────────────────────────────────────────────
export const nav = {
  bar:        "flex items-center gap-6 px-6 py-2.5 border-b border-[#1e2128] bg-[#0d0f12] font-mono",
  brand:      "text-[0.7rem] font-medium tracking-[0.2em] text-[#555b6a]",
  links:      "flex gap-5 flex-1 ml-4",
  link:       "text-xs text-[#555b6a] no-underline hover:text-[#e0e2e8] transition-colors",
  linkActive: "text-xs text-[#e0e2e8] no-underline",
  user:       "flex items-center gap-3 ml-auto",
  badge:      "text-[0.62rem] px-1.5 py-px border border-[#1e2128] text-[#555b6a]",
  badgeAdmin: "text-[0.62rem] px-1.5 py-px border border-[#336791] text-[#4fa3d4]",
  username:   "text-xs text-[#9aa0ae]",
  logout:     "bg-transparent border border-[#1e2128] text-[#555b6a] px-2.5 py-1 text-[0.7rem] font-mono cursor-pointer hover:border-[#e05c5c] hover:text-[#e05c5c] transition-all",
};

// ── JobProgressBar ────────────────────────────────────────────────────────────
export const progress = {
  wrap:           "flex flex-col gap-1",
  meta:           "flex items-center gap-2 font-mono text-[0.68rem]",
  statusDefault:  "font-medium text-[#555b6a]",
  statusSuccess:  "font-medium text-[#4ade80]",
  statusFailed:   "font-medium text-[#e05c5c]",
  statusProgress: "font-medium text-[#4fa3d4]",
  statusPending:  "font-medium text-[#4fa3d4]",
  jobId:          "text-[#3a3f4c] flex-1 overflow-hidden text-ellipsis whitespace-nowrap",
  pct:            "text-[#9aa0ae] ml-auto",
  error:          "text-[0.68rem] text-[#e05c5c] font-mono",
  track:          "h-0.5 bg-[#1e2128] w-full",
  fill:           "h-full bg-[#336791] transition-[width] duration-300",
  fillFailed:     "h-full bg-[#e05c5c] transition-[width] duration-300",
  fillAnimated:   "h-full bg-gradient-to-r from-[#336791] via-[#4fa3d4] to-[#336791] bg-[length:200%] animate-[shimmer_1.5s_linear_infinite]",
};

// ── EditableGrid ──────────────────────────────────────────────────────────────
export const grid = {
  container:    "flex flex-col h-full overflow-hidden",
  toolbar:      "flex items-center justify-between px-4 py-2 border-b border-[#1e2128] bg-[#0d0f12] gap-4",
  toolbarLeft:  "flex items-center gap-3",
  toolbarRight: "flex items-center gap-2",
  search:       "bg-[#13161b] border border-[#1e2128] text-[#e0e2e8] px-3 py-1 text-xs font-mono outline-none focus:border-[#336791] transition-colors w-48",
  rowCount:     "font-mono text-[0.68rem] text-[#555b6a]",
  dirtyBadge:   "ml-2 font-mono text-[0.65rem] text-[#4fa3d4] border border-[#336791] px-1.5 py-px",
  formatSelect: "bg-[#13161b] border border-[#1e2128] text-[#e0e2e8] font-mono text-xs px-2 py-1 outline-none cursor-pointer",
  btnGhost:     "bg-transparent border border-[#1e2128] text-[#555b6a] px-3 py-1 text-xs font-mono cursor-pointer hover:text-[#e0e2e8] hover:border-[#555b6a] transition-all",
  btnSubmit:    "bg-[#e0e2e8] text-[#0d0f12] border-none px-4 py-1 font-mono text-xs font-medium tracking-wider cursor-pointer hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity",
  apiError:     "bg-[#2a1515] border-b border-[#e05c5c33] text-[#e05c5c] px-4 py-2 text-xs font-mono",
  tableScroll:  "flex-1 overflow-auto",
  table:        "w-full border-collapse text-xs font-mono",
  th:           "bg-[#0d0f12] text-[#555b6a] px-3 py-2 text-left font-normal text-[0.65rem] uppercase tracking-widest border-b border-r border-[#1e2128] whitespace-nowrap sticky top-0 cursor-pointer select-none hover:text-[#9aa0ae]",
  rowBase:      "border-b border-[#1a1d24] hover:bg-[#13161b] transition-colors",
  rowDirty:     "border-b border-[#1a1d24] bg-[#0d1929] hover:bg-[#0d1929]",
  rowDeleted:   "border-b border-[#1a1d24] opacity-40 line-through",
  rowApiError:  "border-b border-[#1a1d24] bg-[#2a1515]",
  // Cells
  cell:         "px-3 py-1.5 text-[#9aa0ae] border-r border-[#1a1d24] max-w-[200px]",
  cellDirty:    "px-3 py-1.5 border-r border-[#1a1d24] max-w-[200px] bg-[#0d1929] text-[#4fa3d4]",
  cellError:    "px-3 py-1.5 border-r border-[#1a1d24] max-w-[200px] bg-[#2a1515] text-[#e05c5c]",
  cellValue:    "block truncate",
  cellInput:    "w-full bg-[#0a0c0f] border border-[#336791] text-[#e0e2e8] px-1.5 py-0.5 font-mono text-xs outline-none",
  cellErrorMsg: "block text-[0.6rem] text-[#e05c5c] mt-0.5",
  cellCheckbox: "accent-[#336791] cursor-pointer",
  deleteBtn:    "bg-transparent border-none text-[#3a3f4c] text-xs cursor-pointer px-2 py-1 font-mono hover:text-[#e05c5c] transition-colors",
  deleteBtnOn:  "bg-transparent border-none text-[#e05c5c] text-xs cursor-pointer px-2 py-1 font-mono",
};