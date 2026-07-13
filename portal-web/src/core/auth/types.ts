import type { PermissionKey, RoleId } from '../permissions'

export interface AuthUser {
  employeeCode: string
  name: string
  department: string
  jobTitle: string
  roleId: RoleId
  permissions: PermissionKey[]
}

export interface AuthSession {
  token: string
  user: AuthUser
}

export const AUTH_STORAGE_KEY = 'vj-auth-session'
