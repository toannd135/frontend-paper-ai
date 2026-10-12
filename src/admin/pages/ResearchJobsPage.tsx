import { useCallback } from 'react'
import { Table, Tag, Button, Tooltip, Popconfirm, App as AntApp } from 'antd'
import { FileDown, Trash2, RotateCw } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ApiErrorBanner from '../components/ApiErrorBanner'
import { useAsyncList } from '../hooks/useAsyncList'
import { deleteResearchTask, listResearchTasks, researchPdfUrl, type ResearchSummary } from '../../client/api/research'
import { ApiError } from '../../client/api/http'
import type { ResearchStatus } from '../../types'

const STATUS_MAP: Record<ResearchStatus, { color: string; label: string }> = {
  pending: { color: 'default', label: 'Chờ worker' },
  processing: { color: 'gold', label: 'Đang chạy agent' },
  done: { color: 'success', label: 'Hoàn tất' },
  failed: { color: 'error', label: 'Thất bại' },
}

const STAGES = ['Clarify', 'Plan', 'Search', 'Analyze', 'Critique', 'Synthesize']

function StagePipeline({ status }: { status: ResearchStatus }) {
  // Backend chưa stream tiến độ từng node; pipeline hiển thị theo trạng thái tổng của task.
  const doneCount = status === 'done' ? STAGES.length : status === 'failed' ? 0 : 1
  return (
    <div className="stage-pipeline">
      {STAGES.map((s, i) => (
        <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span className={`stage-pill${i < doneCount ? ' done' : status === 'processing' && i === doneCount ? ' active' : ''}`}>
            {s}
          </span>
          {i < STAGES.length - 1 && <span className="stage-arrow">→</span>}
        </span>
      ))}
    </div>
  )
}

const hasActive = (items: ResearchSummary[]) => items.some((t) => t.status === 'pending' || t.status === 'processing')

export default function ResearchJobsPage() {
  const { message } = AntApp.useApp()
  const loader = useCallback(() => listResearchTasks({ limit: 200 }), [])
  const { items, total, loading, error, reload } = useAsyncList(loader, { pollMs: 4000, shouldPoll: hasActive })

  const remove = async (id: string) => {
    try {
      await deleteResearchTask(id)
      message.success('Đã xoá research task.')
      void reload(true)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Không xoá được.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Research Jobs"
        description={`${total} phiên nghiên cứu của LangGraph agent (clarify → plan → search → analyze → critique → synthesize). Tự làm mới khi còn job đang chạy.`}
        extra={
          <Button icon={<RotateCw size={14} style={{ marginRight: 4 }} />} onClick={() => void reload()} loading={loading}>
            Làm mới
          </Button>
        }
      />

      <ApiErrorBanner error={error} onRetry={() => void reload()} />

      <div className="admin-card">
        <Table
          rowKey="id"
          loading={loading && items.length === 0}
          dataSource={items}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: 'Chưa có phiên nghiên cứu nào.' }}
          columns={[
            {
              title: 'Câu hỏi nghiên cứu',
              dataIndex: 'question',
              render: (v: string, r: ResearchSummary) => (
                // Câu hỏi đã tinh chỉnh và lỗi có thể rất dài -> giới hạn 2 dòng, xem đầy đủ qua tooltip.
                <div style={{ minWidth: 220 }}>
                  <p style={{ margin: 0, fontWeight: 500 }}>{v}</p>
                  {r.refinedQuestion && r.refinedQuestion !== v && (
                    <p className="admin-clamp-2" title={r.refinedQuestion} style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--color-ink-muted)' }}>
                      ↳ {r.refinedQuestion}
                    </p>
                  )}
                  {r.error && (
                    <p className="admin-clamp-2" title={r.error} style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--color-danger)' }}>
                      {r.error}
                    </p>
                  )}
                </div>
              ),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 140,
              render: (s: ResearchStatus) => <Tag color={STATUS_MAP[s].color}>{STATUS_MAP[s].label}</Tag>,
            },
            {
              title: 'Pipeline',
              dataIndex: 'status',
              key: 'pipeline',
              width: 400,
              render: (s: ResearchStatus) => <StagePipeline status={s} />,
            },
            { title: 'Trích dẫn', dataIndex: 'citationCount', width: 90 },
            {
              title: 'Tạo lúc',
              dataIndex: 'createdAt',
              width: 160,
              render: (v: string) => new Date(v).toLocaleString('vi-VN'),
            },
            {
              title: '',
              key: 'actions',
              width: 90,
              render: (_: unknown, r: ResearchSummary) => (
                <div style={{ display: 'flex', gap: 4 }}>
                  <Tooltip title="Xuất PDF (Typst)">
                    <Button
                      type="text"
                      size="small"
                      icon={<FileDown size={14} />}
                      disabled={!r.hasReport}
                      onClick={() => window.open(researchPdfUrl(r.id), '_blank', 'noopener,noreferrer')}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Xoá phiên nghiên cứu này?"
                    okText="Xoá"
                    cancelText="Huỷ"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => void remove(r.id)}
                  >
                    <Button type="text" size="small" danger icon={<Trash2 size={14} />} disabled={r.status === 'processing'} />
                  </Popconfirm>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
