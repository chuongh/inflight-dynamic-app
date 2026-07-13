/**
 * VietJet Ops Portal — product-specific tokens
 * Extends shared brand: design-system/vietjet/MASTER.md
 * @see design-system/vietjet/MASTER.md
 */
import { vjBrand } from './brand'
import { uiUxSemantic, uiUxSpacing } from './uiUxProMax'
import type { RepairRequestStatus } from '../modules/equipment/types'
import type { TrolleyStatus } from '@/modules/equipment/constants'

export interface StatusToken {
  bg: string
  text: string
  dot: string
  border: string
  label: string
}

export const vjTokens = {
  color: {
    primary: vjBrand.colors.primary,
    primaryHover: vjBrand.colors.primaryHover,
    primaryActive: vjBrand.colors.primaryActive,
    primaryDark: vjBrand.colors.redDark,
    primaryMuted: '#FEEAE9',
    primaryGlow: 'rgba(240, 40, 35, 0.12)',

    success: vjBrand.colors.green,
    successDark: vjBrand.colors.greenDark,
    successMuted: '#EDF9E0',
    successBorder: '#B8E67A',
    successBgHover: '#DFF5C4',
    successTextHover: '#3D6600',

    foreground: uiUxSemantic.foreground,
    textPrimary: uiUxSemantic.foreground,
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    surface: '#FFFFFF',
    canvas: uiUxSemantic.background,
    canvasAlt: '#F1F5F9',
    muted: uiUxSemantic.muted,
    border: uiUxSemantic.border,
    borderSubtle: '#F0F0F0',

    accent: vjBrand.colors.accent,
    accentMuted: vjBrand.colors.accentMuted,
    accentOn: vjBrand.colors.accentOn,
    yellowDark: vjBrand.colors.yellowDark,
    accentDark: vjBrand.colors.accentDark,
    accentText: vjBrand.colors.accentText,

    warning: vjBrand.colors.accent,
    warningMuted: vjBrand.colors.accentMuted,
    warningBorder: '#F0DC7A',
    warningBgHover: '#FFDD32',
    warningTextHover: vjBrand.colors.accentDark,

    error: vjBrand.colors.primaryActive,
    errorMuted: '#FEEAE9',
    errorBorder: '#F5B4B4',
    errorBgHover: '#FCE8E8',

    info: '#2563EB',
    infoMuted: '#EFF6FF',
    infoBorder: '#BFDBFE',
    infoBgHover: '#DBEAFE',
    infoText: '#1D4ED8',
    infoTextHover: '#1E40AF',

    /** Ant Layout.siderBg fallback — AppShell uses `gradient.sidebar` CSS */
    sidebar: vjBrand.colors.primary,
    sidebarHover: 'rgba(255, 255, 255, 0.1)',
    sidebarActive: 'rgba(255, 255, 255, 0.16)',
    sidebarActiveText: '#FFFFFF',
    sidebarBorder: 'rgba(255, 255, 255, 0.12)',
    sidebarText: 'rgba(255, 255, 255, 0.75)',
    sidebarTextActive: '#FFFFFF',
    /** Active nav accent on chrome (left bar / icon) */
    sidebarAccent: vjBrand.colors.yellow,

    ring: uiUxSemantic.ring,

    sla: {
      normal: { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' },
      warning: { bg: vjBrand.colors.accentMuted, text: vjBrand.colors.yellowDark, border: '#F0DC7A' },
      critical: { bg: '#FEEAE9', text: vjBrand.colors.redDark, border: '#F5B4B4' },
    },
  },

  gradient: vjBrand.gradient,

  radius: {
    sm: 6,
    md: 10,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  spacing: {
    xs: uiUxSpacing.xs,
    sm: uiUxSpacing.sm,
    md: uiUxSpacing.md,
    lg: uiUxSpacing.lg,
    xl: uiUxSpacing.xl,
    '2xl': uiUxSpacing['2xl'],
  },

  shadow: {
    sm: '0 1px 2px rgba(35, 31, 32, 0.04), 0 1px 3px rgba(35, 31, 32, 0.06)',
    soft: '0 2px 4px rgba(35, 31, 32, 0.04), 0 4px 12px rgba(35, 31, 32, 0.06)',
    card: '0 2px 8px rgba(35, 31, 32, 0.06), 0 8px 24px rgba(35, 31, 32, 0.08)',
    md: '0 4px 6px -1px rgba(35, 31, 32, 0.06), 0 2px 4px -2px rgba(35, 31, 32, 0.04)',
    lg: '0 10px 24px -4px rgba(35, 31, 32, 0.08), 0 4px 8px -4px rgba(35, 31, 32, 0.04)',
    glow: '0 0 0 1px rgba(240, 40, 35, 0.08), 0 8px 24px rgba(240, 40, 35, 0.12)',
  },

  font: {
    heading: vjBrand.typography.heading.family,
    subhead: vjBrand.typography.subhead.family,
    body: vjBrand.typography.body.family,
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },

  typography: {
    display: { size: 32, weight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', font: 'heading' as const },
    h1: { size: 24, weight: 900, lineHeight: 1.2, letterSpacing: '-0.02em', font: 'heading' as const },
    h2: { size: 18, weight: 700, lineHeight: 1.3, letterSpacing: '-0.01em', font: 'subhead' as const },
    h3: { size: 15, weight: 500, lineHeight: 1.4, letterSpacing: '0', font: 'subhead' as const },
    body: { size: 14, weight: 400, lineHeight: 1.6, letterSpacing: '0', font: 'body' as const },
    bodySm: { size: 13, weight: 400, lineHeight: 1.5, letterSpacing: '0', font: 'body' as const },
    caption: { size: 12, weight: 400, lineHeight: 1.4, letterSpacing: '0', font: 'body' as const },
    label: { size: 11, weight: 500, lineHeight: 1.3, letterSpacing: '0.04em', font: 'subhead' as const },
    mono: { size: 12, weight: 600, lineHeight: 1.4, letterSpacing: '0', font: 'mono' as const },
  },

  equipmentStatus: {
    service: {
      bg: '#EDF9E0',
      text: vjBrand.colors.greenDark,
      dot: vjBrand.colors.green,
      border: '#B8E67A',
      label: 'In service',
    },
    'not-service': {
      bg: '#FEEAE9',
      text: vjBrand.colors.primaryActive,
      dot: vjBrand.colors.primary,
      border: '#F5B4B4',
      label: 'Not in service',
    },
    repairing: {
      bg: vjBrand.colors.accentMuted,
      text: vjBrand.colors.yellowDark,
      dot: vjBrand.colors.accent,
      border: '#F0DC7A',
      label: 'Repairing',
    },
  } satisfies Record<TrolleyStatus, StatusToken>,

  repairRequestStatus: {
    open: {
      bg: vjBrand.colors.accentMuted,
      text: vjBrand.colors.yellowDark,
      dot: vjBrand.colors.accent,
      border: '#F0DC7A',
      label: 'Open',
    },
    completed: {
      bg: '#EDF9E0',
      text: vjBrand.colors.greenDark,
      dot: vjBrand.colors.green,
      border: '#B8E67A',
      label: 'Completed',
    },
    cancelled: {
      bg: '#F1F5F9',
      text: '#475569',
      dot: '#94A3B8',
      border: '#E2E8F0',
      label: 'Cancelled',
    },
  } satisfies Record<RepairRequestStatus, StatusToken>,
} as const

/** Chart fills — harmonized donut/bar palette */
export const vjFleetChartColors = {
  service: '#87DC00',
  repairing: '#FFDD32',
  notService: '#F02823',
} as const

export type EquipmentStatusKey = keyof typeof vjTokens.equipmentStatus
export type RepairRequestStatusKey = keyof typeof vjTokens.repairRequestStatus

export const vjOfficialBrandColors = [
  { name: 'Đỏ VJA', hex: vjBrand.colors.red, rgb: '240 40 35' },
  { name: 'Đỏ Đậm VJA', hex: vjBrand.colors.redDark, rgb: '183 0 5' },
  { name: 'Xanh VJA', hex: vjBrand.colors.green, rgb: '135 220 0' },
  { name: 'Vàng VJA', hex: vjBrand.colors.yellow, rgb: '255 221 50' },
] as const

export const vjColorPalette = [
  { name: 'Đỏ VJA (primary)', token: 'primary', hex: vjBrand.colors.red },
  { name: 'Đỏ Đậm VJA (hover/active)', token: 'primaryDark', hex: vjBrand.colors.redDark },
  { name: 'Xanh VJA (success)', token: 'success', hex: vjBrand.colors.green },
  { name: 'Vàng VJA (accent)', token: 'accent', hex: vjBrand.colors.yellow },
  { name: 'Primary muted', token: 'primaryMuted', hex: vjTokens.color.primaryMuted },
  { name: 'Accent muted (badge bg)', token: 'accentMuted', hex: vjBrand.colors.accentMuted },
  { name: 'Success muted', token: 'successMuted', hex: vjTokens.color.successMuted },
  { name: 'Surface', token: 'surface', hex: vjTokens.color.surface },
  { name: 'Foreground', token: 'foreground', hex: vjTokens.color.foreground },
] as const

export const vjGradientPalette = [
  { name: 'Hero panel', token: 'gradient.hero', css: vjBrand.gradient.hero, role: 'Login / marketing hero only' },
  { name: 'Brand stripe', token: 'gradient.bar', css: vjBrand.gradient.bar, role: '4px chrome stripe — đỏ + vàng' },
  { name: 'Soft wash', token: 'gradient.soft', css: vjBrand.gradient.soft, role: 'Canvas wash' },
  { name: 'Sidebar chrome', token: 'gradient.sidebar', css: vjBrand.gradient.sidebar, role: 'Admin shell only — not content canvas' },
] as const
