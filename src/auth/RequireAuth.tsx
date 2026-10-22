import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { UserRole } from './authApi'

export default function RequireAuth({ children, role }: { children: ReactNode; role?: UserRole }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="lazy-fallback">Đang kiểm tra đăng nhập…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname, entry: location.state }} />
  if (role && user.role !== role) return <Navigate to="/home" replace />
  return <>{children}</>
}
