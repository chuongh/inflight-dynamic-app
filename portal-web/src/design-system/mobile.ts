/**
 * VietJet — mobile platform tokens (iOS, Android, React Native).
 * @see design-system/vietjet/platforms/mobile.md
 */
import { vjBrand } from './brand'
import { vjSemantic } from './semantic'

export const vjMobile = {
  colors: vjBrand.colors,
  semantic: vjSemantic,

  touchTarget: {
    /** iOS HIG minimum */
    min: 44,
    /** Android Material comfortable */
    comfortable: 48,
    iconHitSlop: 8,
  },

  safeArea: {
    note: 'Use platform safe area insets — values below are minimum content padding only',
    topPadding: 0,
    bottomPadding: 0,
    horizontalMin: 16,
  },

  screen: {
    gutter: 16,
    gutterTablet: 24,
    maxContentWidth: 600,
  },

  icon: {
    strokeWidth: 2,
    sm: 16,
    md: 24,
    lg: 32,
  },

  typography: {
    largeTitle: 28,
    title: 22,
    headline: 17,
    body: 16,
    bodyLineHeight: 1.5,
    callout: 15,
    caption: 13,
    footnote: 12,
  },

  navigation: {
    bottomNavHeight: 56,
    headerHeight: 56,
    tabIconSize: 24,
    brandStripeHeight: 4,
    maxTabs: 5,
  },

  motion: {
    ...vjSemantic.motion,
    /** Prefer UIKit/Android system transitions on native */
    useSystemTransitions: true,
  },

  haptic: {
    primarySuccess: 'light' as const,
    destructiveConfirm: 'medium' as const,
  },

  /** React Native StyleSheet-friendly export */
  toReactNativeTheme: () => ({
    colors: {
      primary: vjBrand.colors.red,
      primaryPressed: vjBrand.colors.redDark,
      accent: vjBrand.colors.yellow,
      success: vjBrand.colors.green,
      background: vjSemantic.neutral.background,
      surface: vjSemantic.neutral.surface,
      text: vjSemantic.neutral.foreground,
      textSecondary: vjSemantic.neutral.textSecondary,
      border: vjSemantic.neutral.border,
    },
    spacing: vjSemantic.spacing,
    radius: vjSemantic.radius,
    typography: vjMobile.typography,
    touchTargetMin: vjMobile.touchTarget.min,
  }),
} as const

export type VjMobileTheme = ReturnType<typeof vjMobile.toReactNativeTheme>
