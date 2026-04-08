import { tokens as t } from './tokens';

export const nav = {
  bar:        `relative flex items-center gap-6 px-6 py-2.5 border-b ${t.border} ${t.bgBase} font-mono`,
  brand:      `text-[0.7rem] font-medium tracking-[0.2em] ${t.textFaint}`,

  // Desktop — hidden on mobile
  links:      `hidden md:flex gap-5 flex-1 ml-4`,
  link:       `text-xs ${t.textFaint} no-underline hover:${t.textSecondary} transition-colors`,
  linkActive: `text-xs ${t.textSecondary} no-underline`,

  // User row — hide username/signout on mobile
  user:       "flex items-center gap-3 ml-auto",
  badge:      `text-[0.62rem] px-1.5 py-px border ${t.border} ${t.textFaint}`,
  badgeAdmin: `text-[0.62rem] px-1.5 py-px border ${t.borderAccent} ${t.textAccentLight}`,
  username:   `hidden md:block text-xs ${t.textMuted}`,
  logout:     `hidden md:block bg-transparent border ${t.border} ${t.textFaint} px-2.5 py-1 text-[0.7rem] font-mono cursor-pointer hover:border-danger hover:${t.textDanger} transition-all`,

  // Hamburger — visible on mobile only
  hamburger:        `md:hidden flex flex-col gap-1 cursor-pointer bg-transparent border-none p-1`,
  hamburgerLine:    `block w-4 h-px ${t.bgSurfaceAccentMuted} transition-all`,
  hamburgerLineTop: `block w-4 h-px bg-text-secondary transition-all translate-y-[5px] rotate-45`,
  hamburgerLineMid: `hidden`,
  hamburgerLineBot: `block w-4 h-px bg-text-secondary transition-all -translate-y-[1px] -rotate-45`,

  // Mobile drawer
  drawer:          `md:hidden absolute top-full left-0 right-0 ${t.bgBase} border-b ${t.border} flex flex-col z-50`,
  drawerLink:      `px-6 py-3 text-xs ${t.textFaint} no-underline border-b ${t.border} font-mono hover:${t.bgRaised} hover:${t.textSecondary} transition-colors`,
  drawerLinkActive:`px-6 py-3 text-xs ${t.textSecondary} no-underline border-b ${t.border} font-mono border-l-2 border-l-accent-light ${t.bgRaised}`,
  drawerFooter:    `px-6 py-4 flex items-center gap-3`,
};

export const progress = {
  wrap:           "flex flex-col gap-1",
  meta:           "flex items-center gap-2 font-mono text-[0.68rem]",
  statusDefault:  `font-medium ${t.textFaint}`,
  statusSuccess:  `font-medium ${t.textSuccess}`,
  statusFailed:   `font-medium ${t.textDanger}`,
  statusProgress: `font-medium ${t.textAccentLight}`,
  statusPending:  `font-medium ${t.textAccentLight}`,
  jobId:          `${t.textGhost} flex-1 overflow-hidden text-ellipsis whitespace-nowrap`,
  pct:            `${t.textMuted} ml-auto`,
  error:          `text-[0.68rem] ${t.textDanger} font-mono`,
  track:          `h-0.5 ${t.bgOverlay} w-full`,
  fill:           `h-full ${t.bgAccent} transition-[width] duration-300`,
  fillFailed:     `h-full ${t.bgDanger} transition-[width] duration-300`,
  fillAnimated:   `h-full bg-gradient-to-r from-accent via-accent-light to-accent bg-[length:200%] animate-shimmer`,
};

export const grid = {
  container:    "flex flex-col h-full overflow-hidden",
  toolbar:      `flex items-center justify-between px-4 py-2 border-b ${t.border} ${t.bgBase} gap-4`,
  toolbarLeft:  "flex items-center gap-3",
  toolbarRight: "flex items-center gap-2",
  search:       `${t.inputBase} px-3 py-1 text-xs font-mono w-48`,
  rowCount:     `font-mono text-[0.68rem] ${t.textFaint}`,
  dirtyBadge:   `ml-2 font-mono text-[0.65rem] ${t.textAccentLight} border ${t.borderAccent} px-1.5 py-px`,
  formatSelect: `${t.bgRaised} border ${t.border} ${t.textSecondary} font-mono text-xs px-2 py-1 outline-none cursor-pointer`,
  btnGhost:     `${t.btnGhost} border ${t.border} px-3 py-1 text-xs hover:border-text-muted`,
  btnSubmit:    `${t.btnPrimary} px-4 py-1 text-xs`,
  apiError:     `${t.bgSurfaceDanger} border-b border-[#e05c5c33] ${t.textDanger} px-4 py-2 text-xs font-mono`,
  tableScroll:  "flex-1 overflow-auto",
  table:        "w-full border-collapse text-xs font-mono",
  th:           `${t.bgBase} ${t.textFaint} px-3 py-2 text-left font-normal text-[0.65rem] uppercase tracking-widest border-b border-r ${t.border} whitespace-nowrap sticky top-0 cursor-pointer select-none hover:${t.textMuted}`,
  rowBase:      `border-b ${t.border} hover:${t.bgRaised} transition-colors`,
  rowDirty:     `border-b ${t.border} ${t.bgSurfaceAccent} hover:${t.bgSurfaceAccent}`,
  rowDeleted:   `border-b ${t.border} opacity-40 line-through`,
  rowApiError:  `border-b ${t.border} ${t.bgSurfaceDanger}`,
  cell:         `px-3 py-1.5 ${t.textMuted} border-r ${t.border} max-w-[200px]`,
  cellDirty:    `px-3 py-1.5 border-r ${t.border} max-w-[200px] ${t.bgSurfaceAccent} ${t.textAccentLight}`,
  cellError:    `px-3 py-1.5 border-r ${t.border} max-w-[200px] ${t.bgSurfaceDanger} ${t.textDanger}`,
  cellValue:    "block truncate",
  cellInput:    `w-full ${t.bgBase} border ${t.borderAccent} ${t.textSecondary} px-1.5 py-0.5 font-mono text-xs outline-none`,
  cellErrorMsg: `block text-[0.6rem] ${t.textDanger} mt-0.5`,
  cellCheckbox: `${t.bgAccent} cursor-pointer`,
  deleteBtn:    `bg-transparent border-none ${t.textGhost} text-xs cursor-pointer px-2 py-1 font-mono hover:${t.textDanger} transition-colors`,
  deleteBtnOn:  `bg-transparent border-none ${t.textDanger} text-xs cursor-pointer px-2 py-1 font-mono`,
};