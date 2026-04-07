export const s = {
  // Layout
  page:         "grid grid-cols-[200px_1fr] min-h-screen max-w-[1000px] mx-auto",

  // Sidebar
  nav:          "py-8 pr-4 border-r border-[#1e2128] sticky top-0 h-screen overflow-y-auto",
  navTitle:     "font-mono text-[0.62rem] text-[#3a3f4c] uppercase tracking-widest px-3 mb-3",
  navItem:      "block px-3 py-1.5 text-xs text-[#555b6a] no-underline border-l-2 border-transparent hover:text-[#e0e2e8] hover:border-l-[#336791] transition-all font-mono",
  navItemActive:"block px-3 py-1.5 text-xs text-[#e0e2e8] no-underline border-l-2 border-l-[#4fa3d4] font-mono",

  // Content
  content:      "px-10 py-8 pb-16 flex flex-col gap-0",
  section:      "py-8",
  divider:      "border-none border-t border-[#1e2128]",

  // Typography
  h1:           "text-[1.6rem] font-light text-[#f0f2f5] tracking-tight mb-3",
  h2:           "text-lg font-normal text-[#f0f2f5] mb-3",
  h3:           "text-xs font-medium text-[#9aa0ae] uppercase tracking-widest mt-6 mb-3 font-mono",
  p:            "text-sm text-[#9aa0ae] leading-relaxed mb-3",
  pLead:        "text-[0.95rem] text-[#c8ccd4] leading-relaxed mb-3",
  code:         "font-mono text-xs bg-[#13161b] text-[#4fa3d4] px-1.5 py-px border border-[#1e2128]",

  // Flow
  flowStrip:    "flex items-center gap-2 mt-5 flex-wrap",
  flowStep:     "bg-[#13161b] border border-[#1e2128] px-3 py-1 text-xs font-mono text-[#9aa0ae]",
  flowArrow:    "text-[#3a3f4c] text-sm",

  // Steps
  steps:        "flex flex-col gap-4 my-4",
  step:         "flex gap-4 items-start",
  stepNum:      "w-[22px] h-[22px] border border-[#336791] text-[#4fa3d4] text-[0.65rem] font-medium font-mono flex items-center justify-center flex-shrink-0 mt-px",
  stepTitle:    "text-sm font-medium text-[#c8ccd4] mb-1",

  // Callouts
  calloutInfo:  "px-4 py-3 my-4 text-sm text-[#9aa0ae] leading-relaxed border-l-2 border-[#336791] bg-[#0d192988]",
  calloutWarn:  "px-4 py-3 my-4 text-sm text-[#9aa0ae] leading-relaxed border-l-2 border-[#ba7517] bg-[#1f180888]",
  calloutError: "px-4 py-3 my-4 text-sm text-[#9aa0ae] leading-relaxed border-l-2 border-[#e05c5c] bg-[#2a151588]",
  calloutLabelInfo:  "block font-mono text-[0.65rem] font-medium uppercase tracking-widest text-[#4fa3d4] mb-1",
  calloutLabelWarn:  "block font-mono text-[0.65rem] font-medium uppercase tracking-widest text-[#ef9f27] mb-1",
  calloutLabelError: "block font-mono text-[0.65rem] font-medium uppercase tracking-widest text-[#e05c5c] mb-1",

  // Keyboard
  kbdGrid:      "flex flex-col gap-1.5 my-4",
  kbdRow:       "flex items-center gap-3",
  kbd:          "font-mono text-[0.7rem] bg-[#13161b] border border-[#2a2d35] px-2 py-0.5 text-[#9aa0ae] whitespace-nowrap",
  kbdLabel:     "text-sm text-[#9aa0ae]",

  // Role table
  roleTable:    "my-4 border border-[#1e2128]",
  roleHeader:   "grid grid-cols-[1fr_80px_80px] px-3 py-2 font-mono text-[0.65rem] uppercase tracking-widest text-[#555b6a] bg-[#13161b] border-b border-[#1e2128]",
  roleRow:      "grid grid-cols-[1fr_80px_80px] px-3 py-2 font-mono text-xs text-[#9aa0ae] border-b border-[#1e2128] last:border-b-0",
  yes:          "text-center text-[#4ade80]",
  no:           "text-center text-[#555b6a]",

  // Limits
  limitsGrid:   "grid grid-cols-4 gap-px bg-[#1e2128] border border-[#1e2128] my-4",
  limitCard:    "bg-[#0d0f12] p-4 flex flex-col gap-1",
  limitNum:     "font-mono text-[1.4rem] text-[#e0e2e8]",
  limitLabel:   "text-[0.68rem] text-[#555b6a]",

  // Tips
  tipsList:     "flex flex-col gap-2.5 mt-2",
  tipsItem:     "text-sm text-[#9aa0ae] pl-4 relative leading-relaxed before:content-['—'] before:absolute before:left-0 before:text-[#336791] before:font-mono",
};