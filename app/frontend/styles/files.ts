export const s = {
  // Layout
  page:         "max-w-[1100px] mx-auto px-8 py-10 flex flex-col gap-6",

  // Header
  header:       "flex items-start justify-between gap-4 flex-wrap",
  title:        "text-[1.75rem] font-light tracking-tight text-[#f0f2f5]",
  sub:          "text-xs text-[#555b6a] mt-0.5",
  headerActions:"flex items-center gap-2 flex-wrap",
  search:       "bg-[#13161b] border border-[#1e2128] text-[#e0e2e8] px-3 py-1.5 text-xs font-mono outline-none w-48 focus:border-[#336791] transition-colors",
  btnGhost:     "bg-transparent border border-[#1e2128] text-[#555b6a] px-3 py-1.5 text-xs font-mono cursor-pointer hover:border-[#555b6a] hover:text-[#e0e2e8] transition-all",
  btnPrimary:   "bg-[#e0e2e8] text-[#0d0f12] border-none px-4 py-1.5 font-mono text-xs font-medium tracking-wider cursor-pointer no-underline inline-block hover:opacity-85 transition-opacity",

  // Stats
  stats:        "flex gap-px bg-[#1e2128] border border-[#1e2128] w-fit",
  stat:         "bg-[#0d0f12] px-6 py-3 flex flex-col gap-px",
  statNum:      "font-mono text-[1.4rem] font-medium text-[#e0e2e8]",
  statLabel:    "text-[0.65rem] text-[#555b6a] uppercase tracking-widest",

  // States
  loadingBar:   "h-0.5 bg-gradient-to-r from-[#336791] via-[#4ade80] to-[#336791] bg-[length:200%] animate-[shimmer_1.5s_linear_infinite]",
  errorBanner:  "bg-[#2a1515] border border-[#e05c5c33] text-[#e05c5c] px-4 py-2.5 text-xs font-mono",
  emptyState:   "flex flex-col items-center justify-center p-16 text-[#3a3f4c] text-center gap-2",
  emptyIcon:    "text-3xl opacity-20 mb-2",

  // Table
  tableWrap:    "overflow-x-auto border border-[#1e2128]",
  table:        "w-full border-collapse text-xs font-mono",
  th:           "bg-[#13161b] text-[#555b6a] px-3.5 py-2 text-left font-normal text-[0.65rem] uppercase tracking-widest border-b border-[#1e2128] whitespace-nowrap",

  // Row
  row:          "border-b border-[#1a1d24] hover:bg-[#13161b] transition-colors",
  td:           "px-3.5 py-2.5 text-[#9aa0ae] align-middle",
  badgeJson:    "inline-flex items-center gap-1 px-2 py-0.5 text-[0.68rem] font-medium border text-[#4fa3d4] border-[#336791] bg-[#0d1929]",
  badgeCsv:     "inline-flex items-center gap-1 px-2 py-0.5 text-[0.68rem] font-medium border text-[#4ade80] border-[#4ade8044] bg-[#0a1f12]",
  sourceName:   "block text-[#c8ccd4]",
  fileId:       "block text-[0.65rem] text-[#3a3f4c] mt-px",
  numCell:      "px-3.5 py-2.5 text-[#c8ccd4] align-middle text-right",
  checksumCell: "px-3.5 py-2.5 text-[#3a3f4c] align-middle text-[0.7rem]",
  dateCell:     "px-3.5 py-2.5 text-[#9aa0ae] align-middle whitespace-nowrap text-[0.72rem]",
  actionCell:   "px-3.5 py-2.5 align-middle text-right",
  btnDownload:  "bg-transparent border border-[#1e2128] text-[#9aa0ae] px-3 py-1 text-[0.72rem] cursor-pointer font-mono hover:border-[#4ade80] hover:text-[#4ade80] disabled:opacity-30 disabled:cursor-not-allowed transition-all whitespace-nowrap",

  // Nav
  nav:          "flex justify-between pt-2 border-t border-[#1e2128]",
  navLink:      "font-mono text-[0.68rem] text-[#3a3f4c] no-underline hover:text-[#9aa0ae] transition-colors",
};