import { useState } from 'react'
import { Table, Tag, Button, Modal, Upload, Tooltip, App as AntApp } from 'antd'
import type { UploadProps } from 'antd'
import { UploadCloud, Eye, RefreshCw, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import UnimplementedBanner from '../components/UnimplementedBanner'
import { adminPapers, type AdminPaper, type PaperStatus } from '../data/mockAdmin'

const STATUS_MAP: Record<PaperStatus, { color: string; label: string }> = {
  done: { color: 'success', label: 'Hoàn tất' },
  processing: { color: 'gold', label: 'Đang xử lý' },
  pending: { color: 'default', label: 'Chờ xử lý' },
  failed: { color: 'error', label: 'Lỗi' },
}

export default function PapersPage() {
  const { message } = AntApp.useApp()
  const [papers, setPapers] = useState<AdminPaper[]>(adminPapers)
  const [uploadOpen, setUploadOpen] = useState(false)

  const uploadProps: UploadProps = {
    multiple: true,
    accept: '.pdf',
    beforeUpload: (file) => {
      const newPaper: AdminPaper = {
        id: 'new_' + Date.now(),
        filename: file.name,
        status: 'pending',
        error: null,
        sizeKb: Math.round(file.size / 1024),
        pages: 0,
        createdAt: new Date().toISOString(),
      }
      setPapers((prev) => [newPaper, ...prev])
      message.success(`Đã thêm ${file.name} vào hàng đợi xử lý (mô phỏng, chưa gọi POST /papers/upload thật)`)
      return Upload.LIST_IGNORE
    },
  }

  const reprocess = (id: string) => {
    setPapers((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'processing', error: null } : p)))
    message.info('Đã yêu cầu xử lý lại (mô phỏng)')
  }

  const remove = (id: string) => {
    setPapers((prev) => prev.filter((p) => p.id !== id))
    message.success('Đã xoá tài liệu (mô phỏng — backend chưa có DELETE /papers/{id})')
  }

  return (
    <div>
      <PageHeader
        title="Nguồn tài liệu"
        description="Quản lý các PDF đã tải lên hệ thống và theo dõi trạng thái pipeline xử lý (parse → chunk → embed → index)."
        extra={
          <Button
            type="primary"
            icon={<UploadCloud size={14} style={{ marginRight: 4 }} />}
            onClick={() => setUploadOpen(true)}
          >
            Tải tài liệu lên
          </Button>
        }
      />

      <UnimplementedBanner>
        Bảng này ánh xạ trực tiếp tới model <code>Paper</code> và <code>GET /papers/&#123;id&#125;</code> đã có
        trong backend. Hành động Upload/Reprocess/Delete hiện đang mô phỏng phía client — backend mới có{' '}
        <code>POST /papers/upload</code> và <code>GET /papers/&#123;id&#125;</code>, chưa có endpoint xoá hay xử lý
        lại.
      </UnimplementedBanner>

      <div className="admin-card">
        <Table
          rowKey="id"
          dataSource={papers}
          pagination={{ pageSize: 8 }}
          columns={[
            {
              title: 'Tên file',
              dataIndex: 'filename',
              render: (v: string, r: AdminPaper) => (
                <div>
                  <p style={{ margin: 0, fontWeight: 500 }}>{v}</p>
                  {r.error && (
                    <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--color-danger)' }}>{r.error}</p>
                  )}
                </div>
              ),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 130,
              render: (status: PaperStatus) => <Tag color={STATUS_MAP[status].color}>{STATUS_MAP[status].label}</Tag>,
            },
            { title: 'Số trang', dataIndex: 'pages', width: 90 },
            { title: 'Dung lượng', dataIndex: 'sizeKb', width: 110, render: (v: number) => `${(v / 1024).toFixed(1)} MB` },
            {
              title: 'Ngày tải lên',
              dataIndex: 'createdAt',
              width: 150,
              render: (v: string) => new Date(v).toLocaleString('vi-VN'),
            },
            {
              title: '',
              key: 'actions',
              width: 120,
              render: (_: unknown, r: AdminPaper) => (
                <div style={{ display: 'flex', gap: 4 }}>
                  <Tooltip title="Xem chi tiết / chunks">
                    <Button type="text" size="small" icon={<Eye size={14} />} />
                  </Tooltip>
                  <Tooltip title="Xử lý lại">
                    <Button type="text" size="small" icon={<RefreshCw size={14} />} onClick={() => reprocess(r.id)} />
                  </Tooltip>
                  <Tooltip title="Xoá">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<Trash2 size={14} />}
                      onClick={() => remove(r.id)}
                    />
                  </Tooltip>
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal title="Tải tài liệu lên" open={uploadOpen} onCancel={() => setUploadOpen(false)} footer={null}>
        <Upload.Dragger {...uploadProps} style={{ padding: '16px 0' }}>
          <p style={{ margin: 0 }}>
            <UploadCloud size={28} color="var(--color-primary)" />
          </p>
          <p style={{ fontSize: 13.5, margin: '10px 0 4px' }}>Kéo thả file PDF vào đây hoặc bấm để chọn file</p>
          <p style={{ fontSize: 11.5, color: 'var(--color-ink-muted)' }}>Chỉ hỗ trợ định dạng .pdf</p>
        </Upload.Dragger>
      </Modal>
    </div>
  )
}
