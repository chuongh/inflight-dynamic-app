import { createContext } from 'react'
import type { AuthSession, AuthUser } from './types'

export interface AuthContextValue {
  session: AuthSession | null
  login: (employeeCode: string, password: string) => Promise<boolean>
  logout: () => void
  hasPermission: (permission: AuthUser['permissions'][number]) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
