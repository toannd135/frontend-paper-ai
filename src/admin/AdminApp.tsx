import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layout/AdminLayout'
import Dashboard from './pages/Dashboard'
import PapersPage from './pages/PapersPage'
import ResearchJobsPage from './pages/ResearchJobsPage'
import ArticlesPage from './pages/ArticlesPage'
import ConversationsPage from './pages/ConversationsPage'
import UsersPage from './pages/UsersPage'
import RolesPage from './pages/RolesPage'
import AiSettingsPage from './pages/AiSettingsPage'
import SystemSettingsPage from './pages/SystemSettingsPage'
import AuditLogsPage from './pages/AuditLogsPage'

export default function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="papers" element={<PapersPage />} />
        <Route path="research-jobs" element={<ResearchJobsPage />} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="conversations" element={<ConversationsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="settings/ai" element={<AiSettingsPage />} />
        <Route path="settings/system" element={<SystemSettingsPage />} />
        <Route path="logs" element={<AuditLogsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}
