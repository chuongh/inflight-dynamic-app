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
 * Semantic colors from ui-ux-pro-max, overridden with official VJA brand palette.
 * Primary: Đỏ VJA #F02823 — not navy/blue from generic B2B palette.
 */
export const uiUxSemantic = {
  background: '#F8FAFC',
  foreground: '#231F20',
  muted: '#E8ECF1',
  border: '#E2E8F0',
  ring: vjBrand.colors.primary,
  primary: vjBrand.colors.primary,
  onPrimary: '#FFFFFF',
  secondary: '#334155',
  accent: vjBrand.colors.accent,
  destructive: vjBrand.colors.primaryActive,
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
