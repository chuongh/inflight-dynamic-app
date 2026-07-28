/**
 * ui-ux-pro-max bridge — generated recommendations + VietJet brand overrides.
 * @see design-system/vietjet/MASTER.md
 */
import { vjBrand } from './brand'

/** Density 8/10 — dense admin dashboard */
export const uiUxSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
} as const

/** Standard motion tier (4/10) */
export const uiUxMotion = {
  fast: 150,
  normal: 200,
  slow: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const

/**
 * Semantic colors from ui-ux-pro-max (ops navy/sky), with VietJet red reserved
 * for primary CTAs and destructive — not surface/chrome fill.
 * @see design-system/vietjet/MASTER.md
 */
export const uiUxSemantic = {
  background: '#F8FAFC',
  foreground: '#231F20',
  muted: '#E8ECF1',
  border: '#E2E8F0',
  ring: '#0F172A',
  primary: vjBrand.colors.primary,
  onPrimary: '#FFFFFF',
  secondary: '#334155',
  accent: '#0369A1',
  destructive: vjBrand.colors.primaryActive,
} as const

/** Ops chrome tokens — data-dense dashboard (ui-ux-pro-max). */
export const uiUxOpsChrome = {
  ink: '#0F172A',
  accent: '#0369A1',
  accentSoft: '#E8F1F8',
} as const

export const VJ_MASTER_PATH = 'design-system/vietjet/MASTER.md'

export const uiUxChecklist = [
  'Lucide SVG icons only (no emoji icons)',
  'cursor-pointer on all clickable elements',
  'Hover/focus transitions 150–300ms',
  'Text contrast ≥ 4.5:1 on light surfaces',
  'Visible focus rings for keyboard nav',
  'prefers-reduced-motion respected',
  'Tables: horizontal scroll on narrow viewports',
  'Icon-only buttons: aria-label required',
] as const
