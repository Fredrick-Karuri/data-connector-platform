import { tokens as t } from './tokens';

export const s = {
  page:     `min-h-screen flex items-center justify-center ${t.bgBase} [background:radial-gradient(ellipse_60%_40%_at_20%_50%,#0d192933,transparent),radial-gradient(ellipse_60%_40%_at_80%_50%,#0a1f1233,transparent),var(--color-bg-base)]`,
  card: `w-full sm:w-96 p-6 sm:p-10 border ${t.border} ${t.bgBase} flex flex-col gap-2 mx-4 sm:mx-0`,
  logo:     `font-mono text-[0.7rem] tracking-[0.2em] ${t.textFaint} uppercase border ${t.border} px-2 py-1 w-fit mb-3`,
  title:    `text-2xl font-light ${t.textPrimary} tracking-tight`,
  sub:      `text-xs ${t.textGhost} mb-3`,
  form:     "flex flex-col gap-3 mt-2",
  field:    "flex flex-col gap-1",
  label:    `font-mono text-[0.65rem] ${t.textFaint} uppercase tracking-widest`,
  optional: `${t.textGhost} normal-case tracking-normal`,
  input:    `font-sans ${t.inputBase} px-3 py-2 text-sm w-full`,
  error:    `${t.bgSurfaceDanger} border border-[#e05c5c33] ${t.textDanger} px-3 py-2 text-xs font-mono`,
  btn:      `${t.btnPrimary} w-full py-2.5 mt-1 text-xs`,
  switcher: `text-xs ${t.textFaint} mt-2 text-center`,
  link:     `${t.textAccentLight} no-underline hover:underline`,
};