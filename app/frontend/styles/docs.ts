import { tokens as t } from './tokens';

export const s = {
  // Layout
  page:         `grid grid-cols-[200px_1fr] min-h-screen max-w-[1000px] mx-auto`,

  // Sidebar
  nav:          `py-8 pr-4 border-r ${t.border} sticky top-0 h-screen overflow-y-auto`,
  navTitle:     `font-mono text-[0.62rem] ${t.textGhost} uppercase tracking-widest px-3 mb-3`,
  navItem:      `block px-3 py-1.5 text-xs ${t.textFaint} no-underline border-l-2 border-transparent hover:${t.textSecondary} hover:border-l-accent transition-all font-mono`,
  navItemActive:`block px-3 py-1.5 text-xs ${t.textSecondary} no-underline border-l-2 border-l-accent-light font-mono`,

  // Content
  content:      "px-10 py-8 pb-16 flex flex-col gap-0",
  section:      "py-8",
  divider:      `border-none border-t ${t.border}`,

  // Typography
  h1:           `text-[1.6rem] font-light ${t.textPrimary} tracking-tight mb-3`,
  h2:           `text-lg font-normal ${t.textPrimary} mb-3`,
  h3:           `text-xs font-medium ${t.textMuted} uppercase tracking-widest mt-6 mb-3 font-mono`,
  p:            `text-sm ${t.textMuted} leading-relaxed mb-3`,
  pLead:        `text-[0.95rem] text-text-primary/80 leading-relaxed mb-3`,
  code:         `font-mono text-xs ${t.bgRaised} ${t.textAccentLight} px-1.5 py-px border ${t.border}`,

  // Flow
  flowStrip:    "flex items-center gap-2 mt-5 flex-wrap",
  flowStep:     `${t.bgRaised} border ${t.border} px-3 py-1 text-xs font-mono ${t.textMuted}`,
  flowArrow:    `${t.textGhost} text-sm`,

  // Steps
  steps:        "flex flex-col gap-4 my-4",
  step:         "flex gap-4 items-start",
  stepNum:      `w-[22px] h-[22px] border ${t.borderAccent} ${t.textAccentLight} text-[0.65rem] font-medium font-mono flex items-center justify-center flex-shrink-0 mt-px`,
  stepTitle:    `text-sm font-medium text-text-primary/80 mb-1`,

  // Callouts

  calloutInfo:       `px-4 py-3 my-4 text-sm ${t.textMuted} leading-relaxed border-l-2 ${t.borderAccent} ${t.bgSurfaceAccentMuted}`,
  calloutWarn:       `px-4 py-3 my-4 text-sm ${t.textMuted} leading-relaxed border-l-2 ${t.borderWarning} ${t.bgSurfaceWarning}`,
  calloutError:      `px-4 py-3 my-4 text-sm ${t.textMuted} leading-relaxed border-l-2 ${t.borderDanger} ${t.bgSurfaceDangerMuted}`,
  calloutLabelInfo:  `block font-mono text-[0.65rem] font-medium uppercase tracking-widest ${t.textAccentLight} mb-1`,
  calloutLabelWarn:  `block font-mono text-[0.65rem] font-medium uppercase tracking-widest ${t.textWarning} mb-1`,
  calloutLabelError: `block font-mono text-[0.65rem] font-medium uppercase tracking-widest ${t.textDanger} mb-1`,

  // Keyboard
  kbdGrid:      "flex flex-col gap-1.5 my-4",
  kbdRow:       "flex items-center gap-3",
  kbd:          `font-mono text-[0.7rem] ${t.bgRaised} border border-[#2a2d35] px-2 py-0.5 ${t.textMuted} whitespace-nowrap`,
  kbdLabel:     `text-sm ${t.textMuted}`,

  // Role table
  roleTable:    `my-4 border ${t.border}`,
  roleHeader:   `grid grid-cols-[1fr_80px_80px] px-3 py-2 font-mono text-[0.65rem] uppercase tracking-widest ${t.textFaint} ${t.bgRaised} border-b ${t.border}`,
  roleRow:      `grid grid-cols-[1fr_80px_80px] px-3 py-2 font-mono text-xs ${t.textMuted} border-b ${t.border} last:border-b-0`,
  yes:          `text-center ${t.textSuccess}`,
  no:           `text-center ${t.textFaint}`,

  // Limits
  limitsGrid:   `grid grid-cols-4 gap-px ${t.bgOverlay} border ${t.border} my-4`,
  limitCard:    `${t.bgBase} p-4 flex flex-col gap-1`,
  limitNum:     `font-mono text-[1.4rem] ${t.textSecondary}`,
  limitLabel:   `text-[0.68rem] ${t.textFaint}`,

  // Tips
  tipsList:     "flex flex-col gap-2.5 mt-2",
  tipsItem:     `text-sm ${t.textMuted} pl-4 relative leading-relaxed before:content-['—'] before:absolute before:left-0 before:text-accent before:font-mono`,
};