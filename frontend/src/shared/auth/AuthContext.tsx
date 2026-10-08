// Phiên đăng nhập: lưu thông tin hiển thị trong sessionStorage; token JWT do BE cấp được lưu ở lib/http (setToken).
import { createContext, useContext, useState, type ReactNode } from 'react'
import { setToken } from '../lib/http'
import type { Session } from '../types/role'

const KEY = 'SWP_SESSION'

function readSession(app: string): Session | null {
  try {
    const raw = sessionStorage.getItem(`${KEY}_${app}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

interface AuthValue { session: Session | null; login: (s: Session) => void; logout: () => void }
const AuthContext = createContext<AuthValue | null>(null)

// app: 'customer' | 'backoffice' — mỗi app một phiên riêng
export function AuthProvider({ app, children }: { app: string; children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession(app))
  const login = (s: Session) => {
    sessionStorage.setItem(`${KEY}_${app}`, JSON.stringify(s))
    setSession(s)
  }
  const logout = () => {
    sessionStorage.removeItem(`${KEY}_${app}`)
    setToken(null)
    setSession(null)
  }
  return <AuthContext.Provider value={{ session, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải nằm trong AuthProvider')
  return ctx
}
