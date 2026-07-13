/** Single source of truth for app paths — used by router, nav registry, links */
export const paths = {
  login: '/login',
  dashboard: '/dashboard',
  designSystem: '/design-system',
  equipment: {
    trolley: {
      list: '/equipment',
      detail: (code: string) => `/equipment/${code}` as const,
    },
    pos: {
      list: '/equipment/pos',
      detail: (code: string) => `/equipment/pos/${code}` as const,
    },
    ipad: {
      list: '/equipment/ipad',
      detail: (code: string) => `/equipment/ipad/${code}` as const,
    },
  },
} as const
