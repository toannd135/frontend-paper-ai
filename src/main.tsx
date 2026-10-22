import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { App as AntApp } from 'antd'
import { ThemeModeProvider } from './client/state/themeMode'
import ClientApp from './client/ClientApp'
import { AuthProvider } from './auth/AuthContext'
import RequireAuth from './auth/RequireAuth'
import LoginPage from './auth/LoginPage'
import HomePage from './home/HomePage'
import 'katex/dist/katex.min.css'
import './index.css'

// Admin CMS là bundle riêng, không cần tải khi người dùng chỉ dùng trang nghiên cứu.
const AdminApp = lazy(() => import('./admin/AdminApp'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeModeProvider>
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/admin/*"
              element={
                <RequireAuth role="admin">
                  <Suspense fallback={<div className="lazy-fallback">Đang tải trang quản trị…</div>}>
                    <AdminApp />
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route
              path="/home"
              element={<HomePage />}
            />
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route
              path="/workspace"
              element={
                <RequireAuth>
                  <ClientApp />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ThemeModeProvider>
  </StrictMode>,
)
