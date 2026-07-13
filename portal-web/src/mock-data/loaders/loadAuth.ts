import demoUsers from '../auth/demo-users.json'
import type { RoleId } from '../../core/permissions'

export interface DemoUserRecord {
  employeeCode: string
  password: string
  name: string
  department: string
  jobTitle: string
  roleId: RoleId
}

export function loadDemoUsers(): DemoUserRecord[] {
  return demoUsers as DemoUserRecord[]
}

export function findDemoUser(employeeCode: string, password: string): DemoUserRecord | null {
  const normalized = employeeCode.trim().toUpperCase()
  return (
    loadDemoUsers().find(
      (user) =>
        user.employeeCode.toUpperCase() === normalized && user.password === password,
    ) ?? null
  )
}
