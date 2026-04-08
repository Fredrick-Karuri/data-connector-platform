import { tokens as t } from './tokens';

export const s = {
  // Layout
  page:         `max-w-[1100px] mx-auto px-8 py-10 flex flex-col gap-6`,

  // Header
  header:       "flex items-start justify-between gap-4 flex-wrap",
  title:        `text-[1.75rem] font-light tracking-tight ${t.textPrimary}`,
  sub:          `text-xs ${t.textFaint} mt-0.5`,
  headerActions:"flex items-center gap-2 flex-wrap",
  search:       `${t.inputBase} px-3 py-1.5 text-xs font-mono w-48`,
  btnGhost:     `${t.btnGhost} border ${t.border} px-3 py-1.5 text-xs hover:border-text-muted`,
  btnPrimary:   `${t.btnPrimary} px-4 py-1.5 text-xs no-underline inline-block`,

  // Stats
  stats:        `flex gap-px ${t.bgOverlay} border ${t.border} w-fit`,
  stat:         `${t.bgBase} px-6 py-3 flex flex-col gap-px`,
  statNum:      `font-mono text-[1.4rem] font-medium ${t.textSecondary}`,
  statLabel:    `text-[0.65rem] ${t.textFaint} uppercase tracking-widest`,

  // States
  loadingBar:   `h-0.5 bg-gradient-to-r from-accent via-success to-accent bg-[length:200%] animate-shimmer`,
  errorBanner:  `${t.bgSurfaceDanger} border border-[#e05c5c33] ${t.textDanger} px-4 py-2.5 text-xs font-mono`,
  emptyState:   `flex flex-col items-center justify-center p-16 ${t.textGhost} text-center gap-2`,
  emptyIcon:    "text-3xl opacity-20 mb-2",

  // Table
  tableWrap:    `overflow-x-auto border ${t.border}`,
  table:        "w-full border-collapse text-xs font-mono",
  th:           `${t.bgRaised} ${t.textFaint} px-3.5 py-2 text-left font-normal text-[0.65rem] uppercase tracking-widest border-b ${t.border} whitespace-nowrap`,

  // Row
  row:          `border-b ${t.bgOverlay} hover:${t.bgRaised} transition-colors`,
  td:           `px-3.5 py-2.5 ${t.textMuted} align-middle`,
  badgeJson:    `inline-flex items-center gap-1 px-2 py-0.5 text-[0.68rem] font-medium border ${t.textAccentLight} ${t.borderAccent} ${t.bgSurfaceAccent}`,
  badgeCsv:     `inline-flex items-center gap-1 px-2 py-0.5 text-[0.68rem] font-medium border ${t.textSuccess} border-[#4ade8044] ${t.bgSurfaceSuccess}`,
  sourceName:   `block text-text-primary/80`,
  fileId:       `block text-[0.65rem] ${t.textGhost} mt-px`,
  numCell:      `px-3.5 py-2.5 text-text-primary/80 align-middle text-right`,
  checksumCell: `px-3.5 py-2.5 ${t.textGhost} align-middle text-[0.7rem]`,
  dateCell:     `px-3.5 py-2.5 ${t.textMuted} align-middle whitespace-nowrap text-[0.72rem]`,
  actionCell:   "px-3.5 py-2.5 align-middle text-right",
  btnDownload:  `bg-transparent border ${t.border} ${t.textMuted} px-3 py-1 text-[0.72rem] cursor-pointer font-mono hover:border-success hover:${t.textSuccess} disabled:opacity-30 disabled:cursor-not-allowed transition-all whitespace-nowrap`,

  // Nav
  nav:          `flex justify-between pt-2 border-t ${t.border}`,
  navLink:      `font-mono text-[0.68rem] ${t.textGhost} no-underline hover:${t.textMuted} transition-colors`,
};