import { Table, Tag, Button, Tooltip } from 'antd'
import { Eye, FileDown } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import UnimplementedBanner from '../components/UnimplementedBanner'
import { adminArticles, type ArticleStatus } from '../data/mockAdmin'

const STATUS_MAP: Record<ArticleStatus, { color: string; label: string }> = {
  draft: { color: 'default', label: 'Bản nháp' },
  published: { color: 'success', label: 'Đã xuất bản' },
  archived: { color: 'default', label: 'Lưu trữ' },
}

export default function ArticlesPage() {
  return (
    <div>
      <PageHeader
        title="Bài báo"
        description="Quản lý các bài báo được tạo tự động từ nguồn tài liệu đã chọn, cùng trạng thái xuất bản."
      />

      <UnimplementedBanner>
        Backend chưa có entity/endpoint cho bài báo (không có model hay route <code>article</code> nào). Dữ liệu dưới
        đây là <strong>mock</strong> — khi module sinh bài báo (article generation) được triển khai, trang này sẽ gọi{' '}
        <code>GET /articles</code>, <code>PATCH /articles/&#123;id&#125;/status</code> tương ứng.
      </UnimplementedBanner>

      <div className="admin-card">
        <Table
          rowKey="id"
          dataSource={adminArticles}
          pagination={false}
          columns={[
            { title: 'Tiêu đề', dataIndex: 'title', ellipsis: true },
            { title: 'Tác giả', dataIndex: 'author', width: 140 },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 130,
              render: (s: ArticleStatus) => <Tag color={STATUS_MAP[s].color}>{STATUS_MAP[s].label}</Tag>,
            },
            { title: 'Số nguồn', dataIndex: 'sourceCount', width: 90 },
            { title: 'Số từ', dataIndex: 'wordCount', width: 90 },
            {
              title: 'Cập nhật',
              dataIndex: 'updatedAt',
              width: 150,
              render: (v: string) => new Date(v).toLocaleString('vi-VN'),
            },
            {
              title: '',
              key: 'actions',
              width: 90,
              render: () => (
                <div style={{ display: 'flex', gap: 4 }}>
                  <Tooltip title="Xem bài báo">
                    <Button type="text" size="small" icon={<Eye size={14} />} />
                  </Tooltip>
                  <Tooltip title="Xuất PDF">
                    <Button type="text" size="small" icon={<FileDown size={14} />} />
                  </Tooltip>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
