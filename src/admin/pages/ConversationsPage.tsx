import { useState } from 'react'
import { Table, Drawer, Tag } from 'antd'
import { Eye } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import UnimplementedBanner from '../components/UnimplementedBanner'
import { adminConversations, type AdminConversation } from '../data/mockAdmin'

export default function ConversationsPage() {
  const [active, setActive] = useState<AdminConversation | null>(null)

  return (
    <div>
      <PageHeader
        title="Hội thoại"
        description="Toàn bộ lượt hỏi-đáp RAG giữa người dùng và tài liệu đã tải lên."
      />

      <UnimplementedBanner>
        Ánh xạ tới <code>GET /conversations</code> và <code>GET /conversations/&#123;id&#125;</code> đã có trong
        backend — nhưng hai endpoint này hiện <strong>chưa có xác thực, chưa lọc theo người dùng và chưa phân
        trang</strong>. Trước khi gắn màn hình này vào API thật, cần bổ sung auth + tham số limit/offset/paper_id.
      </UnimplementedBanner>

      <div className="admin-card">
        <Table
          rowKey="id"
          dataSource={adminConversations}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: 'Tài liệu', dataIndex: 'paperTitle', ellipsis: true },
            { title: 'Số tin nhắn', dataIndex: 'messageCount', width: 110 },
            { title: 'Tin nhắn gần nhất', dataIndex: 'lastMessagePreview', ellipsis: true },
            {
              title: 'Tạo lúc',
              dataIndex: 'createdAt',
              width: 150,
              render: (v: string) => new Date(v).toLocaleString('vi-VN'),
            },
            {
              title: '',
              key: 'actions',
              width: 60,
              render: (_: unknown, r: AdminConversation) => (
                <Eye size={15} style={{ cursor: 'pointer' }} onClick={() => setActive(r)} />
              ),
            },
          ]}
        />
      </div>

      <Drawer
        title={active?.paperTitle}
        open={!!active}
        onClose={() => setActive(null)}
        width={420}
      >
        {active && (
          <div>
            <Tag color="processing">{active.messageCount} tin nhắn</Tag>
            <p style={{ marginTop: 16, fontSize: 13, color: 'var(--color-ink-muted)' }}>
              Xem chi tiết toàn bộ luồng tin nhắn sẽ gọi <code>GET /conversations/{active.id}</code>. Bản mock chỉ
              hiển thị tin nhắn gần nhất:
            </p>
            <div
              style={{
                background: 'var(--color-msg-ai)',
                borderRadius: 12,
                padding: 12,
                fontSize: 13.5,
                lineHeight: 1.6,
              }}
            >
              {active.lastMessagePreview}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
