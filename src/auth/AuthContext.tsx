import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchMe, login as apiLogin, register as apiRegister, type AuthUser } from './authApi'
import { clearLocalSessionData, getToken, setToken, setUnauthorizedHandler } from './tokenStore'

interface AuthContextValue {
  user: AuthUser | null
  /** true khi đang kiểm tra token đã lưu lúc mở trang. */
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState<boolean>(() => !!getToken())

  const logout = useCallback(() => {
    setToken(null)
    clearLocalSessionData()
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  useEffect(() => {
    if (!getToken()) return
    let cancelled = false
    fetchMe()
      .then((u) => !cancelled && setUser(u))
      .catch(() => !cancelled && setToken(null))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password)
    clearLocalSessionData() // không để lại dữ liệu cục bộ của người dùng trước
    setToken(res.access_token)
    setUser(res.user)
  }, [])

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    const res = await apiRegister(email, password, fullName)
    clearLocalSessionData()
    setToken(res.access_token)
    setUser(res.user)
  }, [])

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>')
  return ctx
}
