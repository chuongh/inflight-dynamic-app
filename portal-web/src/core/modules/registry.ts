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
      {
        id: 'workshop',
        labelKey: 'nav.repairWorkshop',
        path: paths.equipment.workshop.list,
        permission: 'equipment.read',
      },
      {
        id: 'scorecard',
        labelKey: 'nav.vendorScorecard',
        path: paths.equipment.report.list,
        permission: 'equipment.read',
      },
    ],
  },
  {
    id: 'catering',
    labelKey: 'nav.catering',
    path: paths.catering.grouping.list,
    permission: 'catering.quota.manage',
    children: [
      {
        id: 'catering-grouping',
        labelKey: 'nav.cateringGrouping',
        path: paths.catering.grouping.list,
        permission: 'catering.read',
      },
      {
        id: 'catering-quota',
        labelKey: 'nav.inflightMealQuota',
        path: paths.catering.quota.list,
        permission: 'catering.quota.manage',
      },
      {
        id: 'catering-config',
        labelKey: 'nav.cateringConfig',
        path: paths.catering.config.list,
        permission: 'catering.quota.manage',
      },
    ],
  },
  {
    id: 'airports',
    labelKey: 'nav.airports',
    path: paths.airports.list,
    permission: 'airports.read',
  },
  {
    id: 'administration',
    labelKey: 'nav.administration',
    path: paths.admin.users,
    permission: 'admin.users.read',
    children: [
      {
        id: 'iam-users',
        labelKey: 'nav.users',
        path: paths.admin.users,
        permission: 'admin.users.read',
      },
      {
        id: 'iam-roles',
        labelKey: 'nav.roles',
        path: paths.admin.roles,
        permission: 'admin.users.read',
      },
      {
        id: 'iam-permissions',
        labelKey: 'nav.permissions',
        path: paths.admin.permissions,
        permission: 'admin.users.read',
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
  catering: { sectionTitleKey: 'nav.catering' },
  'catering-grouping': { sectionTitleKey: 'nav.cateringGrouping', moduleLabelKey: 'nav.catering' },
  'catering-quota': { sectionTitleKey: 'nav.inflightMealQuota', moduleLabelKey: 'nav.catering' },
  'catering-config': { sectionTitleKey: 'nav.cateringConfig', moduleLabelKey: 'nav.catering' },
  airports: { sectionTitleKey: 'nav.airports' },
  pos: { sectionTitleKey: 'nav.pos', moduleLabelKey: 'nav.equipment' },
  ipad: { sectionTitleKey: 'nav.ipad', moduleLabelKey: 'nav.equipment' },
  'trolley-carts': { sectionTitleKey: 'nav.trolleyCarts', moduleLabelKey: 'nav.equipment' },
  workshop: { sectionTitleKey: 'nav.repairWorkshop', moduleLabelKey: 'nav.equipment' },
  scorecard: { sectionTitleKey: 'nav.vendorScorecard', moduleLabelKey: 'nav.equipment' },
  'iam-users': { sectionTitleKey: 'nav.users', moduleLabelKey: 'nav.administration' },
  'iam-roles': { sectionTitleKey: 'nav.roles', moduleLabelKey: 'nav.administration' },
  'iam-permissions': { sectionTitleKey: 'nav.permissions', moduleLabelKey: 'nav.administration' },
}
