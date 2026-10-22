import { useCallback, useEffect, useState } from 'react'
import { App, Table, Tag, Select, Switch } from 'antd'
import PageHeader from '../components/PageHeader'
import ApiErrorBanner from '../components/ApiErrorBanner'
import { listUsers, updateUser, type AuthUser, type UserRole } from '../../auth/authApi'
import { useAuth } from '../../auth/AuthContext'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'user', label: 'Người dùng' },
]

export default function UsersPage() {
  const { message } = App.useApp()
  const { user: me } = useAuth()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await listUsers())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách người dùng.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const change = async (id: string, patch: { role?: UserRole; is_active?: boolean }) => {
    try {
      const updated = await updateUser(id, patch)
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
    } catch (err) {
      void message.error(err instanceof Error ? err.message : 'Không cập nhật được người dùng.')
      void reload()
    }
  }

  return (
    <div>
      <PageHeader title="Người dùng" description="Quản lý tài khoản, vai trò và trạng thái truy cập hệ thống." />
      <ApiErrorBanner error={error} onRetry={() => void reload()} />
      <div className="admin-card">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={users}
          pagination={false}
          columns={[
            {
              title: 'Người dùng',
              render: (_: unknown, u: AuthUser) => (
                <div>
                  <p style={{ margin: 0, fontWeight: 500 }}>{u.full_name || u.email}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--color-ink-muted)' }}>{u.email}</p>
                </div>
              ),
            },
            {
              title: 'Vai trò',
              dataIndex: 'role',
              width: 180,
              render: (role: UserRole, u: AuthUser) => (
                <Select
                  size="small"
                  value={role}
                  style={{ width: 150 }}
                  disabled={u.id === me?.id}
                  options={ROLE_OPTIONS}
                  onChange={(value) => void change(u.id, { role: value })}
                />
              ),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'is_active',
              width: 170,
              render: (active: boolean, u: AuthUser) => (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Switch
                    size="small"
                    checked={active}
                    disabled={u.id === me?.id}
                    onChange={(checked) => void change(u.id, { is_active: checked })}
                  />
                  <Tag color={active ? 'success' : 'error'}>{active ? 'Hoạt động' : 'Đã khoá'}</Tag>
                </span>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
