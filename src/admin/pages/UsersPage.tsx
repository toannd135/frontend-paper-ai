import { Table, Tag, Button, Select } from 'antd'
import { UserPlus } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import UnimplementedBanner from '../components/UnimplementedBanner'
import { adminUsers, roleDefs, type AdminUser, type UserRole, type UserStatus } from '../data/mockAdmin'

const STATUS_MAP: Record<UserStatus, { color: string; label: string }> = {
  active: { color: 'success', label: 'Hoạt động' },
  invited: { color: 'gold', label: 'Đã mời' },
  suspended: { color: 'error', label: 'Tạm khoá' },
}

export default function UsersPage() {
  return (
    <div>
      <PageHeader
        title="Người dùng"
        description="Quản lý tài khoản, vai trò và trạng thái truy cập hệ thống."
        extra={
          <Button type="primary" icon={<UserPlus size={14} style={{ marginRight: 4 }} />}>
            Mời người dùng
          </Button>
        }
      />

      <UnimplementedBanner>
        Backend hiện <strong>không có bảng users, không có auth/JWT, không có route quản lý user nào</strong>{' '}
        (<code>app/api/routes/users.py</code> chỉ là docstring rỗng). Papers/Conversations cũng chưa gắn với chủ sở
        hữu. Đây là mock IA cho module này — cần xây mới toàn bộ auth + user CRUD trước khi màn hình này hoạt động
        thật.
      </UnimplementedBanner>

      <div className="admin-card">
        <Table
          rowKey="id"
          dataSource={adminUsers}
          pagination={false}
          columns={[
            {
              title: 'Người dùng',
              dataIndex: 'name',
              render: (v: string, r: AdminUser) => (
                <div>
                  <p style={{ margin: 0, fontWeight: 500 }}>{v}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--color-ink-muted)' }}>{r.email}</p>
                </div>
              ),
            },
            {
              title: 'Vai trò',
              dataIndex: 'role',
              width: 160,
              render: (role: UserRole) => (
                <Select
                  size="small"
                  value={role}
                  variant="borderless"
                  style={{ width: 130 }}
                  options={roleDefs.map((r) => ({ value: r.key, label: r.label }))}
                />
              ),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 120,
              render: (s: UserStatus) => <Tag color={STATUS_MAP[s].color}>{STATUS_MAP[s].label}</Tag>,
            },
            { title: 'Tài liệu đã tải', dataIndex: 'papersUploaded', width: 130 },
            {
              title: 'Tham gia',
              dataIndex: 'joinedAt',
              width: 130,
              render: (v: string) => new Date(v).toLocaleDateString('vi-VN'),
            },
          ]}
        />
      </div>
    </div>
  )
}
