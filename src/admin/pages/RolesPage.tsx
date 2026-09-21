import { Tag } from 'antd'
import { ShieldCheck } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import UnimplementedBanner from '../components/UnimplementedBanner'
import { roleDefs } from '../data/mockAdmin'

export default function RolesPage() {
  return (
    <div>
      <PageHeader
        title="Vai trò & quyền"
        description="Định nghĩa các vai trò trong hệ thống và tập quyền tương ứng."
      />

      <UnimplementedBanner>
        Chưa có khái niệm role/permission nào trong backend hiện tại. Đề xuất 4 vai trò chuẩn dưới đây (Admin /
        Editor / Researcher / Viewer) làm điểm khởi đầu khi xây dựng RBAC thật.
      </UnimplementedBanner>

      <div className="admin-stat-grid">
        {roleDefs.map((r) => (
          <div className="admin-card" key={r.key}>
            <p className="admin-card-title">
              <ShieldCheck size={16} color="var(--color-primary)" /> {r.label}
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--color-ink-muted)', marginBottom: 12 }}>{r.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {r.permissions.map((p) => (
                <Tag key={p} color="default">
                  {p}
                </Tag>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
