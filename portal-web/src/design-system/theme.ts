import type { ThemeConfig } from 'antd'
import { uiUxMotion } from './uiUxProMax'
import { vjTokens } from './tokens'

const c = vjTokens.color

export const vietjetAntTheme: ThemeConfig = {
  token: {
    colorPrimary: c.primary,
    colorError: c.error,
    colorSuccess: c.success,
    colorWarning: c.accent,
    colorInfo: c.info,
    colorTextSecondary: c.textSecondary,
    colorBorder: c.border,
    colorBgContainer: c.surface,
    colorBgLayout: c.canvas,
    fontFamily: vjTokens.font.body,
    borderRadius: vjTokens.radius.md,
    controlHeight: 40,
    fontSize: 14,
    motionDurationFast: `${uiUxMotion.fast}ms`,
    motionDurationMid: `${uiUxMotion.normal}ms`,
    motionDurationSlow: `${uiUxMotion.slow}ms`,
    motionEaseInOut: uiUxMotion.easing,

    colorSuccessBg: c.successMuted,
    colorSuccessBgHover: c.successBgHover,
    colorSuccessBorder: c.successBorder,
    colorSuccessText: c.successDark,
    colorSuccessTextHover: c.successTextHover,
    colorSuccessActive: c.successDark,

    colorWarningBg: c.warningMuted,
    colorWarningBgHover: c.warningBgHover,
    colorWarningBorder: c.warningBorder,
    colorWarningText: c.yellowDark,
    colorWarningTextHover: c.warningTextHover,
    colorWarningActive: c.warningTextHover,

    colorErrorBg: c.errorMuted,
    colorErrorBgHover: c.errorBgHover,
    colorErrorBorder: c.errorBorder,
    colorErrorText: c.primaryActive,
    colorErrorTextHover: c.primaryDark,
    colorErrorActive: c.primaryDark,

    colorInfoBg: c.infoMuted,
    colorInfoBgHover: c.infoBgHover,
    colorInfoBorder: c.infoBorder,
    colorInfoText: c.infoText,
    colorInfoTextHover: c.infoTextHover,
    colorInfoActive: c.infoTextHover,

    colorPrimaryBg: c.primaryMuted,
    colorPrimaryBgHover: c.errorBgHover,
    colorPrimaryBorder: c.errorBorder,
    colorPrimaryText: c.primaryHover,
    colorPrimaryTextHover: c.primaryActive,
    colorPrimaryTextActive: c.primaryDark,
  },
  components: {
    Layout: {
      headerBg: c.surface,
      siderBg: c.primary,
      bodyBg: c.canvas,
    },
    Button: {
      primaryShadow: 'none',
      fontWeight: 600,
      borderRadius: vjTokens.radius.md,
    },
    Card: {
      borderRadiusLG: vjTokens.radius.lg,
      paddingLG: vjTokens.spacing.lg,
      boxShadowTertiary: vjTokens.shadow.card,
    },
    Modal: {
      borderRadiusLG: vjTokens.radius.lg,
    },
    Table: {
      headerBg: c.canvasAlt,
      headerColor: c.textSecondary,
      rowHoverBg: c.primaryMuted,
      borderColor: c.borderSubtle,
    },
    Input: {
      activeBorderColor: c.primary,
      hoverBorderColor: c.textMuted,
      borderRadius: vjTokens.radius.md,
    },
    Select: {
      optionSelectedBg: c.primaryMuted,
      optionActiveBg: c.primaryMuted,
      borderRadius: vjTokens.radius.md,
    },
    Tabs: {
      itemSelectedColor: c.primary,
      itemHoverColor: c.primaryHover,
      inkBarColor: c.primary,
      itemActiveColor: c.primaryActive,
    },
    Tooltip: {
      borderRadius: vjTokens.radius.sm,
    },
    Dropdown: {
      borderRadiusLG: vjTokens.radius.md,
      paddingBlock: 6,
    },
    Tag: {
      defaultBg: c.canvasAlt,
      defaultColor: c.textSecondary,
      borderRadiusSM: vjTokens.radius.sm,
      fontSizeSM: 12,
      lineHeightSM: 1.35,
    },
    Alert: {
      borderRadiusLG: vjTokens.radius.md,
      fontSize: 13,
      fontSizeIcon: 16,
      paddingContentVerticalSM: 10,
      paddingContentHorizontal: 14,
    },
    Message: {
      contentBg: c.surface,
      borderRadiusLG: vjTokens.radius.md,
    },
    Notification: {
      borderRadiusLG: vjTokens.radius.lg,
    },
  },
}
