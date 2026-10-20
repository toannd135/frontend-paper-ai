// Mock data CHỈ cho các module chưa có backend: users, roles, audit log.
// Papers / Research Jobs / Conversations / Dashboard đã dùng API thật (src/client/api/*).

export type UserRole = 'admin' | 'editor' | 'researcher' | 'viewer'
export type UserStatus = 'active' | 'invited' | 'suspended'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  papersUploaded: number
  joinedAt: string
}

export const adminUsers: AdminUser[] = [
  { id: 'u1', name: 'Nguyễn Văn A', email: 'nguyenvana@paperai.dev', role: 'admin', status: 'active', papersUploaded: 14, joinedAt: '2026-06-01T00:00:00Z' },
  { id: 'u2', name: 'Trần Thị B', email: 'tranthib@paperai.dev', role: 'researcher', status: 'active', papersUploaded: 6, joinedAt: '2026-07-12T00:00:00Z' },
  { id: 'u3', name: 'Lê Văn C', email: 'levanc@paperai.dev', role: 'editor', status: 'active', papersUploaded: 3, joinedAt: '2026-08-02T00:00:00Z' },
  { id: 'u4', name: 'Phạm Thị D', email: 'phamthid@paperai.dev', role: 'researcher', status: 'suspended', papersUploaded: 1, joinedAt: '2026-08-20T00:00:00Z' },
  { id: 'u5', name: 'Hoàng Minh E', email: 'hoangminhe@paperai.dev', role: 'viewer', status: 'invited', papersUploaded: 0, joinedAt: '2026-09-15T00:00:00Z' },
]

export interface RoleDef {
  key: UserRole
  label: string
  description: string
  permissions: string[]
}

export const roleDefs: RoleDef[] = [
  {
    key: 'admin',
    label: 'Admin',
    description: 'Toàn quyền quản trị hệ thống, người dùng và cấu hình AI.',
    permissions: ['Quản lý người dùng', 'Cấu hình hệ thống & AI', 'Quản lý nội dung', 'Xem audit log'],
  },
  {
    key: 'editor',
    label: 'Editor',
    description: 'Chỉnh sửa và xuất bản bài báo, quản lý nguồn tài liệu.',
    permissions: ['Quản lý nội dung', 'Duyệt/Xuất bản bài báo'],
  },
  {
    key: 'researcher',
    label: 'Researcher',
    description: 'Tải tài liệu, chạy nghiên cứu, tạo bài báo cho riêng mình.',
    permissions: ['Tải tài liệu', 'Chạy nghiên cứu', 'Tạo bài báo'],
  },
  {
    key: 'viewer',
    label: 'Viewer',
    description: 'Chỉ xem, không có quyền chỉnh sửa.',
    permissions: ['Xem nội dung'],
  },
]

export interface AuditLogEntry {
  id: string
  actor: string
  action: string
  target: string
  status: 'success' | 'failed'
  at: string
}

export const auditLogs: AuditLogEntry[] = [
  { id: 'log_1', actor: 'nguyenvana@paperai.dev', action: 'upload_paper', target: 'rag-survey-2024.pdf', status: 'success', at: '2026-09-21T09:14:00Z' },
  { id: 'log_2', actor: 'system', action: 'process_paper', target: 'g7h8i9', status: 'success', at: '2026-09-21T07:45:00Z' },
  { id: 'log_3', actor: 'system', action: 'process_paper', target: 'm4n5o6', status: 'failed', at: '2026-09-19T15:33:00Z' },
  { id: 'log_4', actor: 'levanc@paperai.dev', action: 'update_role', target: 'u4 -> suspended', status: 'success', at: '2026-09-18T10:02:00Z' },
  { id: 'log_5', actor: 'nguyenvana@paperai.dev', action: 'update_ai_settings', target: 'HYBRID_ALPHA 0.7 -> 0.65', status: 'success', at: '2026-09-17T14:12:00Z' },
]
