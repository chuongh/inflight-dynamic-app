export const PERMISSIONS = {
  'portal.dashboard.view': 'View dashboard',
  'equipment.read': 'View equipment',
  'equipment.edit': 'Create and edit equipment',
  'equipment.maintenance': 'Send equipment to repair',
  'equipment.defect.manage': 'Manage defect catalog',
  'equipment.report.view': 'View fault reports',
  'admin.users.manage': 'Manage users and roles',
  'airports.read': 'View airports',
  'catering.read': 'View catering',
  'sales.read': 'View sales',
  'dispatch.read': 'View dispatch',
} as const

export type PermissionKey = keyof typeof PERMISSIONS

export type RoleId = 'admin' | 'equipment_staff' | 'viewer'

export interface RoleDefinition {
  id: RoleId
  label: string
  permissions: PermissionKey[]
}

export const ROLES: Record<RoleId, RoleDefinition> = {
  admin: {
    id: 'admin',
    label: 'Administrator',
    permissions: Object.keys(PERMISSIONS) as PermissionKey[],
  },
  equipment_staff: {
    id: 'equipment_staff',
    label: 'Equipment Staff',
    permissions: [
      'portal.dashboard.view',
      'equipment.read',
      'equipment.edit',
      'equipment.maintenance',
      'equipment.defect.manage',
      'equipment.report.view',
    ],
  },
  viewer: {
    id: 'viewer',
    label: 'Viewer',
    permissions: ['portal.dashboard.view', 'equipment.read', 'equipment.report.view'],
  },
}

export function permissionsForRole(roleId: RoleId): PermissionKey[] {
  return ROLES[roleId]?.permissions ?? []
}

export function canAccess(permissions: PermissionKey[], required: PermissionKey | PermissionKey[]): boolean {
  const needed = Array.isArray(required) ? required : [required]
  return needed.every((key) => permissions.includes(key))
}
