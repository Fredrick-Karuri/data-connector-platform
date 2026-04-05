export const s = {
  // Layout
  page:        "max-w-[1100px] mx-auto px-8 py-10",
  header:      "flex items-start justify-between mb-8",
  title:       "text-[1.75rem] font-light tracking-tight text-[#f0f2f5]",
  sub:         "text-xs text-[#555b6a] mt-0.5",

  // Buttons
  btnPrimary:  "bg-[#e0e2e8] text-[#0d0f12] border-none px-4 py-2 font-mono text-xs font-medium tracking-wider cursor-pointer hover:opacity-85 disabled:opacity-35 disabled:cursor-not-allowed transition-opacity",
  btnOutline:  "bg-transparent text-[#e0e2e8] border border-[#2a2d35] px-4 py-2 font-mono text-xs cursor-pointer hover:border-[#e0e2e8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors",
  btnGhost:    "bg-transparent border-none text-[#555b6a] text-xs cursor-pointer px-1.5 py-0.5 font-mono hover:text-[#e0e2e8] transition-colors",
  btnGhostDanger: "bg-transparent border-none text-[#555b6a] text-xs cursor-pointer px-1.5 py-0.5 font-mono hover:text-[#e05c5c] transition-colors",

  // Stats
  statsRow:    "grid grid-cols-4 gap-px bg-[#1e2128] border border-[#1e2128] mb-8",
  statCard:    "bg-[#0d0f12] px-5 py-4 flex flex-col gap-0.5",
  statNum:     "font-mono text-[1.6rem] font-medium text-[#e0e2e8]",
  statHealthy: "font-mono text-[1.6rem] font-medium text-[#4ade80]",
  statOffline: "font-mono text-[1.6rem] font-medium text-[#e05c5c]",
  statMuted:   "font-mono text-[1.6rem] font-medium text-[#555b6a]",
  statLabel:   "text-[0.7rem] text-[#555b6a] uppercase tracking-widest",

  // Cards
  cardsGrid:   "grid gap-px bg-[#1e2128]",
  card:        "bg-[#0d0f12] p-5 cursor-pointer hover:bg-[#13161b] transition-colors border-l-[3px] border-l-solid",
  cardTop:     "flex items-center justify-between mb-2.5",
  dbBadge:     "font-mono text-[0.7rem] font-medium uppercase tracking-widest",
  statusDot:   "w-1.5 h-1.5 rounded-full",
  statusHealthy: "w-1.5 h-1.5 rounded-full bg-[#4ade80] shadow-[0_0_6px_#4ade8066]",
  statusOffline: "w-1.5 h-1.5 rounded-full bg-[#e05c5c]",
  connName:    "text-base font-normal text-[#f0f2f5] mb-3",
  cardMeta:    "flex items-center justify-between",
  metaText:    "text-[0.68rem] text-[#3a3f4c] font-mono",
  cardActions: "flex gap-1",

  // States
  loadingBar:  "h-0.5 bg-gradient-to-r from-[#336791] via-[#4ade80] to-[#336791] bg-[length:200%] animate-[slide_1.5s_linear_infinite] mb-6",
  errorBanner: "bg-[#2a1515] border border-[#e05c5c33] text-[#e05c5c] px-4 py-3 text-xs font-mono mb-6",
  emptyState:  "text-center py-16 px-8 text-[#3a3f4c]",
  emptyIcon:   "block text-4xl mb-4 opacity-30",

  // Detail panel
  detailPanel: "fixed right-0 top-0 bottom-0 w-[360px] bg-[#0d0f12] border-l border-[#1e2128] p-6 overflow-y-auto flex flex-col gap-4",
  detailHeader:"flex items-center justify-between",
  detailTitle: "text-base font-normal text-[#f0f2f5]",
  detailTable: "w-full border-collapse text-[0.78rem]",
  detailTd:    "py-2 px-1 border-b border-[#1e2128] text-[#9aa0ae]",
  detailTdKey: "py-2 px-1 border-b border-[#1e2128] text-[#555b6a] font-mono w-[45%]",
  extractLink: "block text-center no-underline mt-auto",

  // Modal
  modalOverlay:"fixed inset-0 bg-black/70 flex items-center justify-center z-[100]",
  modal:       "bg-[#13161b] border border-[#1e2128] w-[480px] max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-3",
  modalHeader: "flex items-center justify-between mb-1",
  modalTitle:  "text-sm font-medium text-[#f0f2f5] font-mono",
  fieldLabel:  "text-[0.68rem] text-[#555b6a] uppercase tracking-widest block mb-1",
  fieldInput:  "w-full bg-[#0d0f12] border border-[#1e2128] text-[#e0e2e8] px-3 py-2 text-sm outline-none focus:border-[#336791] transition-colors",
  dbTypeGrid:  "grid grid-cols-4 gap-1",
  dbTypeBtn:   "bg-[#0d0f12] border border-[#1e2128] text-[#555b6a] py-1.5 text-[0.68rem] font-mono cursor-pointer uppercase tracking-wider hover:border-[#336791] hover:text-[#e0e2e8] transition-all",
  dbTypeBtnActive: "bg-[#0d1929] border border-[#336791] text-[#e0e2e8] py-1.5 text-[0.68rem] font-mono cursor-pointer uppercase tracking-wider",
  fieldsGrid:  "grid grid-cols-2 gap-3",
  span2:       "col-span-2",
  testSuccess: "font-mono text-xs px-3 py-2 bg-[#0a1f12] text-[#4ade80] border border-[#4ade8033]",
  testError:   "font-mono text-xs px-3 py-2 bg-[#2a1515] text-[#e05c5c] border border-[#e05c5c33]",
  modalFooter: "flex gap-3 justify-end mt-2",
};