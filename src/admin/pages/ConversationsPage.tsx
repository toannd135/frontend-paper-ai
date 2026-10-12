import { useCallback, useEffect, useState } from 'react'
import { Table, Drawer, Tag, Button, Spin } from 'antd'
import { Eye, RotateCw } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import UnimplementedBanner from '../components/UnimplementedBanner'
import ApiErrorBanner from '../components/ApiErrorBanner'
import { useAsyncList } from '../hooks/useAsyncList'
import { getConversation, listConversations, type ConversationDetail, type ConversationSummary } from '../../client/api/chat'
import { ApiError } from '../../client/api/http'

export default function ConversationsPage() {
  const loader = useCallback(() => listConversations({ limit: 200 }), [])
  const { items, total, loading, error, reload } = useAsyncList(loader)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ConversationDetail | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeId) return
    let cancelled = false
    setDetail(null)
    setDetailError(null)
    getConversation(activeId)
      .then((d) => {
        if (!cancelled) setDetail(d)
      })
      .catch((err) => {
        if (!cancelled) setDetailError(err instanceof ApiError ? err.message : 'Không tải được hội thoại.')
      })
    return () => {
      cancelled = true
    }
  }, [activeId])

  return (
    <div>
      <PageHeader
        title="Hội thoại"
        description={`${total} phiên hỏi-đáp RAG (POST /chat) đã lưu trong Postgres.`}
        extra={
          <Button icon={<RotateCw size={14} style={{ marginRight: 4 }} />} onClick={() => void reload()} loading={loading}>
            Làm mới
          </Button>
        }
      />

      <UnimplementedBanner>
        Dữ liệu thật từ <code>GET /conversations</code>. Backend chưa có xác thực nên mọi hội thoại đều hiển thị, không
        lọc theo người dùng.
      </UnimplementedBanner>

      <ApiErrorBanner error={error} onRetry={() => void reload()} />

      <div className="admin-card">
        <Table
          rowKey="id"
          loading={loading && items.length === 0}
          dataSource={items}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: 'Chưa có hội thoại nào.' }}
          columns={[
            {
              title: 'Hội thoại',
              dataIndex: 'id',
              width: 200,
              render: (v: string, r: ConversationSummary) => (
                <div>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontSize: 12 }}>{v.slice(0, 8)}…</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--color-ink-muted)' }}>
                    {r.paperId ? `paper ${r.paperId.slice(0, 8)}…` : 'toàn kho tài liệu'}
                  </p>
                </div>
              ),
            },
            { title: 'Số tin nhắn', dataIndex: 'messageCount', width: 110 },
            {
              title: 'Tin nhắn gần nhất',
              dataIndex: 'lastMessage',
              ellipsis: true,
              render: (v: string | null) => v ?? '—',
            },
            {
              title: 'Tạo lúc',
              dataIndex: 'createdAt',
              width: 160,
              render: (v: string) => new Date(v).toLocaleString('vi-VN'),
            },
            {
              title: '',
              key: 'actions',
              width: 60,
              render: (_: unknown, r: ConversationSummary) => (
                <Button
                  type="text"
                  size="small"
                  icon={<Eye size={15} />}
                  onClick={() => setActiveId(r.id)}
                  aria-label="Xem hội thoại"
                />
              ),
            },
          ]}
        />
      </div>

      <Drawer title="Chi tiết hội thoại" open={!!activeId} onClose={() => setActiveId(null)} width={480}>
        <ApiErrorBanner error={detailError} />
        {!detail && !detailError && <Spin />}
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Tag color="processing" style={{ alignSelf: 'flex-start' }}>
              {detail.messages.length} tin nhắn
            </Tag>
            {detail.messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  background: m.role === 'user' ? 'var(--color-msg-user)' : 'var(--color-msg-ai)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  maxWidth: '92%',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.content}
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  )
}
