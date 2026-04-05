export const s = {
  // Layout
  page:        "grid grid-cols-[280px_1fr] h-screen overflow-hidden",

  // Query panel
  queryPanel:  "border-r border-[#1e2128] flex flex-col gap-2.5 p-5 overflow-y-auto bg-[#0d0f12]",
  panelHeader: "flex items-center justify-between mb-2",
  panelTitle:  "font-mono text-sm font-medium text-[#f0f2f5] tracking-wider uppercase",
  fileLink:    "font-mono text-[0.7rem] text-[#4fa3d4] no-underline hover:underline",

  // Form
  fieldLabel:  "font-mono text-[0.65rem] text-[#555b6a] uppercase tracking-widest block",
  fieldHint:   "text-[#3a3f4c] normal-case tracking-normal",
  fieldSelect: "w-full bg-[#13161b] border border-[#1e2128] text-[#e0e2e8] font-mono text-xs px-2.5 py-1.5 outline-none focus:border-[#336791] transition-colors cursor-pointer",
  fieldTextarea:"w-full bg-[#13161b] border border-[#1e2128] text-[#e0e2e8] font-mono text-xs px-2.5 py-2 outline-none focus:border-[#336791] transition-colors resize-y min-h-[100px] leading-relaxed",
  skeleton:    "h-8 bg-[#13161b] border border-[#1e2128] animate-pulse",

  connMeta:    "flex items-center gap-1.5 font-mono text-[0.68rem] text-[#555b6a]",
  connDotHealthy: "w-1 h-1 rounded-full bg-[#4ade80]",
  connDotOffline: "w-1 h-1 rounded-full bg-[#e05c5c]",

  // Batch
  batchRow:    "flex items-center gap-2",
  batchSlider: "flex-1 accent-[#336791] cursor-pointer",
  batchNumber: "w-[70px] bg-[#13161b] border border-[#1e2128] text-[#e0e2e8] font-mono text-xs px-1.5 py-1 text-right outline-none focus:border-[#336791] transition-colors",

  // Button
  btnExtract:  "w-full bg-[#e0e2e8] text-[#0d0f12] border-none py-2.5 mt-1 font-mono text-xs font-medium tracking-wider cursor-pointer flex items-center justify-center gap-1.5 hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity",
  spinner:     "w-2.5 h-2.5 border border-[#0d0f12] border-t-transparent rounded-full inline-block animate-spin",

  // Summary
  summary:     "flex items-baseline gap-1.5 p-2 bg-[#0a1f12] border border-[#4ade8022]",
  summaryNum:  "font-mono text-lg text-[#4ade80]",
  summaryLabel:"text-[0.68rem] text-[#555b6a]",

  // Nav
  panelNav:    "mt-auto flex justify-between pt-4 border-t border-[#1e2128]",
  navLink:     "font-mono text-[0.68rem] text-[#3a3f4c] no-underline hover:text-[#9aa0ae] transition-colors",

  // Grid panel
  gridPanel:   "flex flex-col overflow-hidden",
  gridEmpty:   "flex-1 flex flex-col items-center justify-center gap-3 text-[#3a3f4c] text-sm",
  gridEmptyIcon:"text-5xl opacity-15",
  gridEmptySub:"text-[0.72rem] text-[#2a2d35]",
  gridLoading: "flex-1 flex flex-col items-center justify-center gap-3 text-[#3a3f4c] text-sm",
  loadingPulse:"w-10 h-10 rounded-full border-2 border-[#1e2128] border-t-[#336791] animate-spin",
};