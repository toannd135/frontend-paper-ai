import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from 'antd'
import viVN from 'antd/locale/vi_VN'
import { antdTheme } from './theme'
import ClientApp from './client/ClientApp'
import 'katex/dist/katex.min.css'
import './index.css'

// Admin CMS là bundle riêng, không cần tải khi người dùng chỉ dùng trang nghiên cứu.
const AdminApp = lazy(() => import('./admin/AdminApp'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider theme={antdTheme} locale={viVN}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<div className="lazy-fallback">Đang tải trang quản trị…</div>}>
                  <AdminApp />
                </Suspense>
              }
            />
            <Route path="/*" element={<ClientApp />} />
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
)
