import { tokens as t } from "./tokens";

export const s = {
  // Layout
  page: "grid grid-cols-1 md:grid-cols-[280px_1fr] h-screen overflow-hidden",

  // Query panel
  queryPanel: `fixed md:relative inset-0 md:inset-auto z-40 border-r ${t.border} flex flex-col gap-2.5 p-5 overflow-y-auto ${t.bgBase} transition-transform md:translate-x-0`,
  queryPanelOpen: "translate-x-0",
  queryPanelClosed: "-translate-x-full md:translate-x-0",

  panelHeader: "flex items-center justify-between mb-2",
  panelTitle: `font-mono text-sm font-medium ${t.textPrimary} tracking-wider uppercase`,
  fileLink: `font-mono text-[0.7rem] ${t.textAccentLight} no-underline hover:underline`,

  // Form
  fieldLabel: `font-mono text-[0.65rem] ${t.textFaint} uppercase tracking-widest block`,
  fieldHint: `${t.textGhost} normal-case tracking-normal`,
  fieldSelect: `w-full ${t.fieldInput} px-2.5 py-1.5 cursor-pointer`,
  fieldTextarea: `w-full ${t.fieldInput} px-2.5 py-2 resize-y min-h-[100px] leading-relaxed`,
  skeleton: `h-8 ${t.bgRaised} border ${t.border} animate-pulse`,

  connMeta: `flex items-center gap-1.5 font-mono text-[0.68rem] ${t.textFaint}`,
  connDotHealthy: `w-1 h-1 rounded-full ${t.bgSuccess}`,
  connDotOffline: `w-1 h-1 rounded-full ${t.bgDanger}`,

  // Batch
  batchRow: "flex items-center gap-2",
  batchSlider: `flex-1 accent-accent cursor-pointer`,
  batchNumber: `w-[70px] ${t.fieldInput} px-1.5 py-1 text-right`,

  // Button
  btnExtract: `${t.btnPrimary} w-full py-2.5 mt-1 text-xs flex items-center justify-center gap-1.5`,
  spinner: `w-2.5 h-2.5 ${t.spinner} border-bg-base border-t-transparent`,

  // Summary
  summary: `flex items-baseline gap-1.5 p-2 ${t.bgSurfaceSuccess} border border-[#4ade8022]`,
  summaryNum: `font-mono text-lg ${t.textSuccess}`,
  summaryLabel: `text-[0.68rem] ${t.textFaint}`,

  // Nav
  panelNav: `mt-auto flex justify-between pt-4 border-t ${t.border}`,
  navLink: `font-mono text-[0.68rem] ${t.textGhost} no-underline hover:${t.textMuted} transition-colors`,

  // Grid panel
  gridPanel: "flex flex-col overflow-hidden",
  gridEmpty: `flex-1 flex flex-col items-center justify-center gap-3 ${t.textGhost} text-sm`,
  gridEmptyIcon: "text-5xl opacity-15",
  gridEmptySub: `text-[0.72rem] text-[#2a2d35]`,
  gridLoading: `flex-1 flex flex-col items-center justify-center gap-3 ${t.textGhost} text-sm`,
  loadingPulse: `w-10 h-10 ${t.spinner} border-2 ${t.border} border-t-accent`,
};
