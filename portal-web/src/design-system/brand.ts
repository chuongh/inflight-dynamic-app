/**
 * VietJet Air (VJA) — official brand tokens
 * Cross-product: consumer app, ops portal, internal tools, mobile.
 * @see design-system/vietjet/MASTER.md
 * @see design-system/vietjet/TOKENS.md
 */
export const vjBrand = {
  guidelinesUrl: 'https://www.vietjetair.com/company/branding/index.html',
  guidelinesAsset: '/brand/vja-brand-guidelines.png',

  colors: {
    /** Đỏ VJA — RGB 240 40 35 — primary buttons, links, active nav */
    red: '#F02823',
    /** Đỏ Đậm VJA — RGB 183 0 5 — hover/active, danger emphasis */
    redDark: '#B70005',
    /** Xanh VJA — RGB 135 220 0 — success, in-service */
    green: '#87DC00',
    /** Vàng VJA — RGB 255 221 50 — stripe, warning CTA, dots */
    yellow: '#FFDD32',

    primary: '#F02823',
    primaryHover: '#D91E1A',
    primaryActive: '#B70005',

    accent: '#FFDD32',
    accentMuted: '#FFF4C4',
    accentHover: '#F5D000',
    accentOn: '#231F20',
    yellowDark: '#C9A000',
    accentDark: '#C9A000',
    accentDarkHover: '#F5D000',
    accentText: '#C9A000',

    greenBrand: '#87DC00',
    yellowBrand: '#FFDD32',
    /** Dark green for badge text on muted green bg */
    greenDark: '#4A7A00',

    white: '#FFFFFF',
  },

  gradient: {
    hero: [
      'radial-gradient(ellipse 55% 45% at 88% 12%, rgba(255, 221, 50, 0.2), transparent 55%)',
      'linear-gradient(155deg, #F02823 0%, #D91E1A 48%, #B70005 100%)',
    ].join(', '),
    soft: [
      'radial-gradient(ellipse 70% 50% at 8% 0%, rgba(240, 40, 35, 0.05), transparent 55%)',
      'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
    ].join(', '),
    bar: 'linear-gradient(90deg, #F02823 0%, #F02823 76%, #FFDD32 76%, #FFDD32 100%)',
    /** Admin shell sidebar — depth chrome; not for content canvas */
    sidebar: [
      'radial-gradient(ellipse 100% 55% at -8% 0%, rgba(255, 221, 50, 0.16), transparent 52%)',
      'linear-gradient(180deg, #F02823 0%, #D91E1A 50%, #B70005 100%)',
    ].join(', '),
  },

  typography: {
    heading: {
      family: '"JambonoVN Black", "Jambono Black", "Nunito", sans-serif',
      weight: 900,
    },
    subhead: {
      family: '"JambonoVN Medium", "Jambono Medium", "Nunito", sans-serif',
      weight: 500,
    },
    body: {
      family: '"Plus Jakarta Sans", Inter, system-ui, sans-serif',
      weight: 400,
    },
  },

  fontsPath: '/fonts',
} as const

export type VjBrandGradient = keyof typeof vjBrand.gradient
