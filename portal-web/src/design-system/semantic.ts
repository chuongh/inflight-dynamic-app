/**
 * VietJet — shared semantic tokens (all products, web + mobile).
 * @see design-system/vietjet/MASTER.md
 * @see design-system/vietjet/TOKENS.md
 */
import { vjBrand } from './brand'

export const vjSemantic = {
  neutral: {
    background: '#F8FAFC',
    foreground: '#231F20',
    surface: '#FFFFFF',
    muted: '#E8ECF1',
    border: '#E2E8F0',
    borderSubtle: '#F0F0F0',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    ring: vjBrand.colors.red,
    canvasAlt: '#F1F5F9',
  },

  derived: {
    primaryHover: vjBrand.colors.primaryHover,
    primaryMuted: '#FEEAE9',
    primaryGlow: 'rgba(240, 40, 35, 0.12)',
    successMuted: '#EDF9E0',
    successBorder: '#B8E67A',
    successDark: vjBrand.colors.greenDark,
    successBgHover: '#DFF5C4',
    successTextHover: '#3D6600',
    warningBorder: '#F0DC7A',
    errorMuted: '#FEEAE9',
    errorBorder: '#F5B4B4',
    errorBgHover: '#FCE8E8',
  },

  status: {
    success: {
      base: vjBrand.colors.green,
      muted: '#EDF9E0',
      text: vjBrand.colors.greenDark,
      border: '#B8E67A',
    },
    warning: {
      base: vjBrand.colors.yellow,
      muted: vjBrand.colors.accentMuted,
      text: vjBrand.colors.yellowDark,
      border: '#F0DC7A',
      onButton: vjBrand.colors.accentOn,
    },
    error: {
      base: vjBrand.colors.redDark,
      muted: '#FEEAE9',
      text: vjBrand.colors.redDark,
      border: '#F5B4B4',
    },
    info: {
      base: '#2563EB',
      muted: '#EFF6FF',
      text: '#1D4ED8',
      border: '#BFDBFE',
    },
    neutral: {
      base: '#94A3B8',
      muted: '#F1F5F9',
      text: '#475569',
      border: '#E2E8F0',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
  },

  radius: {
    sm: 6,
    md: 10,
    lg: 12,
    xl: 16,
    full: 9999,
  },

  motion: {
    fast: 150,
    normal: 200,
    slow: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  typography: {
    display: { size: 32, sizeMobile: 28, weight: 900, lineHeight: 1.15 },
    h1: { size: 24, sizeMobile: 22, weight: 900, lineHeight: 1.2 },
    h2: { size: 18, sizeMobile: 17, weight: 700, lineHeight: 1.3 },
    h3: { size: 15, sizeMobile: 15, weight: 500, lineHeight: 1.4 },
    body: { size: 14, sizeMobile: 16, weight: 400, lineHeight: 1.6 },
    caption: { size: 12, sizeMobile: 13, weight: 400, lineHeight: 1.4 },
    label: { size: 11, sizeMobile: 12, weight: 500, lineHeight: 1.3 },
  },

  shadow: {
    sm: '0 1px 2px rgba(35, 31, 32, 0.04), 0 1px 3px rgba(35, 31, 32, 0.06)',
    soft: '0 2px 4px rgba(35, 31, 32, 0.04), 0 4px 12px rgba(35, 31, 32, 0.06)',
    card: '0 2px 8px rgba(35, 31, 32, 0.06), 0 8px 24px rgba(35, 31, 32, 0.08)',
    md: '0 4px 6px -1px rgba(35, 31, 32, 0.06), 0 2px 4px -2px rgba(35, 31, 32, 0.04)',
    lg: '0 10px 24px -4px rgba(35, 31, 32, 0.08), 0 4px 8px -4px rgba(35, 31, 32, 0.04)',
    glow: '0 0 0 1px rgba(240, 40, 35, 0.08), 0 8px 24px rgba(240, 40, 35, 0.12)',
  },
} as const

export type VjSemanticStatus = keyof typeof vjSemantic.status
