import { useCallback } from 'react'
import { Card, Statistic, Table, Tag, Button } from 'antd'
import { FileStack, MessagesSquare, Workflow, Quote, RotateCw } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ApiErrorBanner from '../components/ApiErrorBanner'
import { useAsyncList } from '../hooks/useAsyncList'
import { listPapers, type PaperInfo } from '../../client/api/papers'
import { listResearchTasks, type ResearchSummary } from '../../client/api/research'
import { listConversations } from '../../client/api/chat'

const iconStyle = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-ink-muted)' }

const PAPER_STATUS: Record<string, { color: string; label: string }> = {
  done: { color: 'success', label: 'Hoàn tất' },
  processing: { color: 'gold', label: 'Đang xử lý' },
  pending: { color: 'default', label: 'Chờ xử lý' },
  failed: { color: 'error', label: 'Lỗi' },
}

export default function Dashboard() {
  const papers = useAsyncList(useCallback(() => listPapers({ limit: 200 }), []))
  const research = useAsyncList(useCallback(() => listResearchTasks(200), []))
  const conversations = useAsyncList(useCallback(() => listConversations(200), []))

  const reloadAll = () => {
    void papers.reload()
    void research.reload()
    void conversations.reload()
  }
  const error = papers.error ?? research.error ?? conversations.error

  const doneCount = papers.items.filter((p) => p.status === 'done').length
  const processingCount = papers.items.filter((p) => p.status === 'processing' || p.status === 'pending').length
  const failedCount = papers.items.filter((p) => p.status === 'failed').length
  const runningJobs = research.items.filter((j) => j.status === 'pending' || j.status === 'processing').length
  const totalCitations = research.items.reduce((s, j) => s + j.citationCount, 0)
  const totalMessages = conversations.items.reduce((s, c) => s + c.messageCount, 0)

  return (
    <div>
      <PageHeader
        title="Tổng quan hệ thống"
        description="Số liệu thật từ backend: tài liệu đã lập chỉ mục, hội thoại RAG và các phiên nghiên cứu của agent."
        extra={
          <Button icon={<RotateCw size={14} style={{ marginRight: 4 }} />} onClick={reloadAll}>
            Làm mới
          </Button>
        }
      />

      <ApiErrorBanner error={error} onRetry={reloadAll} />

      <div className="admin-stat-grid">
        <Card className="admin-card" variant="borderless" styles={{ body: { padding: 0 } }}>
          <div style={iconStyle}>
            <FileStack size={15} /> Tài liệu
          </div>
          <Statistic value={papers.total} loading={papers.loading} valueStyle={{ fontSize: 28, fontWeight: 700, marginTop: 6 }} />
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
          <Statistic
            value={conversations.total}
            loading={conversations.loading}
            valueStyle={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}
          />
          <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 8 }}>{totalMessages} tin nhắn tổng cộng</div>
        </Card>

        <Card className="admin-card" variant="borderless" styles={{ body: { padding: 0 } }}>
          <div style={iconStyle}>
            <Workflow size={15} /> Research Jobs
          </div>
          <Statistic value={research.total} loading={research.loading} valueStyle={{ fontSize: 28, fontWeight: 700, marginTop: 6 }} />
          <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 8 }}>{runningJobs} đang chạy</div>
        </Card>

        <Card className="admin-card" variant="borderless" styles={{ body: { padding: 0 } }}>
          <div style={iconStyle}>
            <Quote size={15} /> Trích dẫn đã gắn
          </div>
          <Statistic value={totalCitations} loading={research.loading} valueStyle={{ fontSize: 28, fontWeight: 700, marginTop: 6 }} />
          <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 8 }}>
            {research.items.filter((j) => j.status === 'done').length} báo cáo hoàn tất
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
            loading={papers.loading && papers.items.length === 0}
            dataSource={papers.items.slice(0, 6)}
            locale={{ emptyText: 'Chưa có tài liệu' }}
            columns={[
              { title: 'Tên file', dataIndex: 'filename', ellipsis: true },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                width: 120,
                render: (status: string) => <Tag color={PAPER_STATUS[status]?.color}>{PAPER_STATUS[status]?.label ?? status}</Tag>,
              },
              {
                title: 'Ngày tải lên',
                dataIndex: 'createdAt',
                width: 120,
                render: (v: string | null, r: PaperInfo) => (v ? new Date(v).toLocaleDateString('vi-VN') : r.id.slice(0, 8)),
              },
            ]}
          />
        </Card>

        <Card className="admin-card" title={null} variant="borderless" styles={{ body: { padding: 0 } }}>
          <p className="admin-card-title">Phiên nghiên cứu gần đây</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {research.items.slice(0, 6).map((job: ResearchSummary) => (
              <div key={job.id} style={{ display: 'flex', gap: 10, fontSize: 12.5, alignItems: 'flex-start' }}>
                <Tag
                  color={job.status === 'done' ? 'success' : job.status === 'failed' ? 'error' : 'gold'}
                  style={{ marginTop: 1 }}
                >
                  {job.status}
                </Tag>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {job.question}
                  </p>
                  <p style={{ margin: '2px 0 0', color: 'var(--color-ink-muted)' }}>
                    {job.citationCount} trích dẫn — {new Date(job.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
            ))}
            {!research.loading && research.items.length === 0 && (
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-ink-muted)' }}>Chưa có phiên nghiên cứu nào.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
