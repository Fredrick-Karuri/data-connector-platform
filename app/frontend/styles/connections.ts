import { tokens as t } from './tokens';

export const s = {
  // Layout
  page:        "max-w-[1100px] mx-auto px-8 py-10",
  header:      "flex items-start justify-between mb-8",
  title:       `text-[1.75rem] font-light tracking-tight ${t.textPrimary}`,
  sub:         `text-xs ${t.textFaint} mt-0.5`,

  // Buttons
  btnPrimary:  `${t.btnPrimary} px-4 py-2 text-xs`,
  btnOutline:  `${t.btnOutline} px-4 py-2 text-xs`,
  btnGhost:    `${t.btnGhost} text-xs px-1.5 py-0.5`,
  btnGhostDanger: `${t.btnGhostDanger} text-xs px-1.5 py-0.5`,

  // Stats
  statsRow:    `grid grid-cols-4 gap-px ${t.bgOverlay} border ${t.border} mb-8`,
  statCard:    `${t.bgBase} px-5 py-4 flex flex-col gap-0.5`,
  statNum:     `font-mono text-[1.6rem] font-medium ${t.textSecondary}`,
  statHealthy: `font-mono text-[1.6rem] font-medium ${t.textSuccess}`,
  statOffline: `font-mono text-[1.6rem] font-medium ${t.textDanger}`,
  statMuted:   `font-mono text-[1.6rem] font-medium ${t.textFaint}`,
  statLabel:   `text-[0.7rem] ${t.textFaint} uppercase tracking-widest`,

  // Cards
  cardsGrid:   `grid gap-px ${t.bgOverlay}`,
  card:        `${t.bgBase} p-5 cursor-pointer hover:${t.bgRaised} transition-colors border-l-[3px] border-l-solid`,
  cardTop:     "flex items-center justify-between mb-2.5",
  dbBadge:     "font-mono text-[0.7rem] font-medium uppercase tracking-widest",
  statusDot:   "w-1.5 h-1.5 rounded-full",
  statusHealthy: `w-1.5 h-1.5 rounded-full ${t.bgSuccess} shadow-[0_0_6px_#4ade8066]`,
  statusOffline: `w-1.5 h-1.5 rounded-full ${t.bgDanger}`,
  connName:    `text-base font-normal ${t.textPrimary} mb-3`,
  cardMeta:    "flex items-center justify-between",
  metaText:    `text-[0.68rem] ${t.textGhost} font-mono`,
  cardActions: "flex gap-1",

  // States
  loadingBar:  `h-0.5 bg-gradient-to-r from-accent via-success to-accent bg-[length:200%] animate-slide mb-6`,
  errorBanner: `${t.bgSurfaceDanger} border border-[#e05c5c33] ${t.textDanger} px-4 py-3 text-xs font-mono mb-6`,
  emptyState:  `text-center py-16 px-8 ${t.textGhost}`,
  emptyIcon:   "block text-4xl mb-4 opacity-30",

  // Detail panel
  detailPanel: `fixed right-0 top-0 bottom-0 w-[360px] ${t.bgBase} border-l ${t.border} p-6 overflow-y-auto flex flex-col gap-4`,
  detailHeader:"flex items-center justify-between",
  detailTitle: `text-base font-normal ${t.textPrimary}`,
  detailTable: "w-full border-collapse text-[0.78rem]",
  detailTd:    `py-2 px-1 border-b ${t.border} ${t.textMuted}`,
  detailTdKey: `py-2 px-1 border-b ${t.border} ${t.textFaint} font-mono w-[45%]`,
  extractLink: "block text-center no-underline mt-auto",

  // Modal
  modalOverlay: "fixed inset-0 bg-black/70 flex items-center justify-center z-[100]",
  modal:        `${t.bgRaised} border ${t.border} w-[480px] max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-3`,
  modalHeader:  "flex items-center justify-between mb-1",
  modalTitle:   `text-sm font-medium ${t.textPrimary} font-mono`,
  fieldLabel:   `text-[0.68rem] ${t.textFaint} uppercase tracking-widest block mb-1`,
  fieldInput:   `w-full ${t.inputBase} px-3 py-2 text-sm`,
  dbTypeGrid:   "grid grid-cols-4 gap-1",
  dbTypeBtn:    `${t.bgBase} border ${t.border} ${t.textFaint} py-1.5 text-[0.68rem] font-mono cursor-pointer uppercase tracking-wider hover:${t.borderAccent} hover:${t.textSecondary} transition-all`,
  dbTypeBtnActive: `${t.bgSurfaceAccent} border ${t.borderAccent} ${t.textSecondary} py-1.5 text-[0.68rem] font-mono cursor-pointer uppercase tracking-wider`,
  fieldsGrid:   "grid grid-cols-2 gap-3",
  span2:        "col-span-2",
  testSuccess:  `font-mono text-xs px-3 py-2 ${t.bgSurfaceSuccess} ${t.textSuccess} border border-[#4ade8033]`,
  testError:    `font-mono text-xs px-3 py-2 ${t.bgSurfaceDanger} ${t.textDanger} border border-[#e05c5c33]`,
  modalFooter:  "flex gap-3 justify-end mt-2",
};