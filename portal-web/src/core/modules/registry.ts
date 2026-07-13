import type { LucideIcon } from 'lucide-react'
import type { PermissionKey } from '../permissions'
import { paths } from '@/routes/paths'

export interface PortalModuleChild {
  id: string
  labelKey: string
  path: string
  permission: PermissionKey
}

export interface PortalModule {
  id: string
  labelKey: string
  path?: string
  permission: PermissionKey
  disabled?: boolean
  children?: PortalModuleChild[]
}

export const PORTAL_MODULES: PortalModule[] = [
  {
    id: 'dashboard',
    labelKey: 'nav.dashboard',
    path: paths.dashboard,
    permission: 'portal.dashboard.view',
  },
  {
    id: 'design-system',
    labelKey: 'nav.designSystem',
    path: paths.designSystem,
    permission: 'portal.dashboard.view',
  },
  {
    id: 'equipment',
    labelKey: 'nav.equipment',
    path: paths.equipment.trolley.list,
    permission: 'equipment.read',
    children: [
      {
        id: 'trolley-carts',
        labelKey: 'nav.trolleyCarts',
        path: paths.equipment.trolley.list,
        permission: 'equipment.read',
      },
      {
        id: 'pos',
        labelKey: 'nav.pos',
        path: paths.equipment.pos.list,
        permission: 'equipment.read',
      },
      {
        id: 'ipad',
        labelKey: 'nav.ipad',
        path: paths.equipment.ipad.list,
        permission: 'equipment.read',
      },
    ],
  },
]

export function moduleVisible(module: PortalModule, permissions: PermissionKey[]): boolean {
  if (module.disabled) return permissions.includes(module.permission)
  if (module.children) {
    return module.children.some((child) => permissions.includes(child.permission))
  }
  return permissions.includes(module.permission)
}

export interface MenuItemMeta {
  key: string
  labelKey: string
  path?: string
  disabled?: boolean
  icon?: LucideIcon
}

/** Breadcrumb keys for topbar based on current route */
export const NAV_SECTION_KEYS: Record<
  string,
  { sectionTitleKey: string; moduleLabelKey?: string }
> = {
  dashboard: { sectionTitleKey: 'nav.dashboard' },
  'design-system': { sectionTitleKey: 'nav.designSystem' },
  pos: { sectionTitleKey: 'nav.pos', moduleLabelKey: 'nav.equipment' },
  ipad: { sectionTitleKey: 'nav.ipad', moduleLabelKey: 'nav.equipment' },
  'trolley-carts': { sectionTitleKey: 'nav.trolleyCarts', moduleLabelKey: 'nav.equipment' },
}
