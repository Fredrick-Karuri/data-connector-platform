export const tokens = {
  // Surfaces
  bgBase:          "bg-bg-base",
  bgRaised:        "bg-bg-raised",
  bgOverlay:       "bg-bg-overlay",

  // Borders
  border:          "border-border-subtle",

  // Text
  textPrimary:     "text-text-primary",
  textSecondary:   "text-text-secondary",
  textMuted:       "text-text-muted",
  textFaint:       "text-text-faint",
  textGhost:       "text-text-ghost",

  // Accent
  textAccent:      "text-accent",
  textAccentLight: "text-accent-light",
  bgAccent:        "bg-accent",
  bgAccentLight:   "bg-accent-light",
  borderAccent:    "border-accent",

  // State — text
  textSuccess:     "text-success",
  textDanger:      "text-danger",

  // State — surfaces
  bgSurfaceDanger: "bg-surface-danger",
  bgSurfaceAccent: "bg-surface-accent",
  bgSurfaceSuccess:"bg-surface-success",

  // State — bg
  bgSuccess:       "bg-success",
  bgDanger:        "bg-danger",

  // Common patterns
  inputBase:       "bg-bg-raised border border-border-subtle text-text-secondary outline-none focus:border-accent transition-colors",
  btnPrimary:      "bg-text-secondary text-bg-base font-mono font-medium tracking-wider cursor-pointer hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity",
  btnOutline:      "bg-transparent border border-border-subtle text-text-secondary font-mono cursor-pointer hover:border-text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors",
  btnGhost:        "bg-transparent border-none text-text-faint font-mono cursor-pointer hover:text-text-secondary transition-colors",
  btnGhostDanger:  "bg-transparent border-none text-text-faint font-mono cursor-pointer hover:text-danger transition-colors",
  fieldInput:   "bg-bg-raised border border-border-subtle text-text-secondary font-mono text-xs outline-none focus:border-accent transition-colors",
  spinner:      "rounded-full border border-t-transparent animate-spin",

  // warnings
  textWarning:     "text-warning",
  borderWarning:   "border-warning-border",
  bgSurfaceWarning:"bg-surface-warning",
  bgSurfaceAccentMuted:  "bg-surface-accent/50",
  bgSurfaceDangerMuted:  "bg-surface-danger/50",
  borderDanger:          "border-danger",
} as const;