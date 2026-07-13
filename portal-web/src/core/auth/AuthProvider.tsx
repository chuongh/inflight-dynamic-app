import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { findDemoUser } from '../../mock-data/loaders/loadAuth'
import { permissionsForRole } from '../permissions'
import { AuthContext, type AuthContextValue } from './authContext'
import type { AuthSession, AuthUser } from './types'
import { AUTH_STORAGE_KEY } from './types'

function readSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

function writeSession(session: AuthSession | null) {
  if (!session) {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    sessionStorage.removeItem('vj-auth')
    return
  }
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  sessionStorage.setItem('vj-auth', 'true')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readSession())

  const login = useCallback(async (employeeCode: string, password: string) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const record = findDemoUser(employeeCode, password)
    if (!record) return false

    const next: AuthSession = {
      token: `demo-${record.employeeCode}`,
      user: {
        employeeCode: record.employeeCode,
        name: record.name,
        department: record.department,
        jobTitle: record.jobTitle,
        roleId: record.roleId,
        permissions: permissionsForRole(record.roleId),
      },
    }
    writeSession(next)
    setSession(next)
    return true
  }, [])

  const logout = useCallback(() => {
    writeSession(null)
    setSession(null)
  }, [])

  const hasPermission = useCallback(
    (permission: AuthUser['permissions'][number]) =>
      session?.user.permissions.includes(permission) ?? false,
    [session],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ session, login, logout, hasPermission }),
    [session, login, logout, hasPermission],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
