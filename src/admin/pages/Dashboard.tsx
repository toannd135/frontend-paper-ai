import { Card, Statistic, Table, Tag } from 'antd'
import { FileStack, MessagesSquare, Workflow, Newspaper, CheckCircle2, AlertTriangle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import {
  adminPapers,
  adminConversations,
  adminResearchJobs,
  adminArticles,
  auditLogs,
} from '../data/mockAdmin'

const iconStyle = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-ink-muted)' }

export default function Dashboard() {
  const doneCount = adminPapers.filter((p) => p.status === 'done').length
  const processingCount = adminPapers.filter((p) => p.status === 'processing' || p.status === 'pending').length
  const failedCount = adminPapers.filter((p) => p.status === 'failed').length
  const runningJobs = adminResearchJobs.filter((j) => j.stage !== 'done' && j.stage !== 'failed').length

  return (
    <div>
      <PageHeader
        title="Tổng quan hệ thống"
        description="Số liệu tổng hợp về tài liệu, hội thoại, research job và bài báo trong hệ thống PaperAI."
      />

      <div className="admin-stat-grid">
        <Card className="admin-card" variant="borderless" styles={{ body: { padding: 0 } }}>
          <div style={iconStyle}>
            <FileStack size={15} /> Tổng tài liệu
          </div>
          <Statistic value={adminPapers.length} valueStyle={{ fontSize: 28, fontWeight: 700, marginTop: 6 }} />
          <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 12 }}>
            <span style={{ color: 'var(--color-primary)' }}>{doneCount} hoàn tất</span>
            <span style={{ color: 'var(--color-gold-hover)' }}>{processingCount} đang xử lý</span>
            <span style={{ color: 'var(--color-danger)' }}>{failedCount} lỗi</span>
          </div>
        </Card>

        <Card className="admin-card" variant="borderless" styles={{ body: { padding: 0 } }}>
          <div style={iconStyle}>
            <MessagesSquare size={15} /> Hội thoại RAG
          </div>
          <Statistic value={adminConversations.length} valueStyle={{ fontSize: 28, fontWeight: 700, marginTop: 6 }} />
          <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 8 }}>
            {adminConversations.reduce((s, c) => s + c.messageCount, 0)} tin nhắn tổng cộng
          </div>
        </Card>

        <Card className="admin-card" variant="borderless" styles={{ body: { padding: 0 } }}>
          <div style={iconStyle}>
            <Workflow size={15} /> Research Jobs
          </div>
          <Statistic value={adminResearchJobs.length} valueStyle={{ fontSize: 28, fontWeight: 700, marginTop: 6 }} />
          <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 8 }}>
            {runningJobs} đang chạy
          </div>
        </Card>

        <Card className="admin-card" variant="borderless" styles={{ body: { padding: 0 } }}>
          <div style={iconStyle}>
            <Newspaper size={15} /> Bài báo
          </div>
          <Statistic value={adminArticles.length} valueStyle={{ fontSize: 28, fontWeight: 700, marginTop: 6 }} />
          <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 8 }}>
            {adminArticles.filter((a) => a.status === 'published').length} đã xuất bản
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }} className="admin-dashboard-grid">
        <Card className="admin-card" title={null} variant="borderless" styles={{ body: { padding: 0 } }}>
          <p className="admin-card-title">Tài liệu gần đây</p>
          <Table
            size="small"
            pagination={false}
            rowKey="id"
            dataSource={adminPapers.slice(0, 5)}
            columns={[
              { title: 'Tên file', dataIndex: 'filename', ellipsis: true },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                width: 120,
                render: (status: string) => {
                  const map: Record<string, { color: string; label: string }> = {
                    done: { color: 'success', label: 'Hoàn tất' },
                    processing: { color: 'gold', label: 'Đang xử lý' },
                    pending: { color: 'default', label: 'Chờ xử lý' },
                    failed: { color: 'error', label: 'Lỗi' },
                  }
                  const s = map[status]
                  return <Tag color={s.color}>{s.label}</Tag>
                },
              },
              {
                title: 'Ngày tải lên',
                dataIndex: 'createdAt',
                width: 120,
                render: (v: string) => new Date(v).toLocaleDateString('vi-VN'),
              },
            ]}
          />
        </Card>

        <Card className="admin-card" title={null} variant="borderless" styles={{ body: { padding: 0 } }}>
          <p className="admin-card-title">Hoạt động gần đây</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: 10, fontSize: 12.5 }}>
                {log.status === 'success' ? (
                  <CheckCircle2 size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
                ) : (
                  <AlertTriangle size={15} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 1 }} />
                )}
                <div>
                  <p style={{ margin: 0, color: 'var(--color-ink)' }}>
                    <strong>{log.actor}</strong> · {log.action}
                  </p>
                  <p style={{ margin: '2px 0 0', color: 'var(--color-ink-muted)' }}>
                    {log.target} — {new Date(log.at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
