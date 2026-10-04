import { useCallback, useState } from 'react'
import { Table, Tag, Button, Modal, Upload, Tooltip, Popconfirm, App as AntApp } from 'antd'
import type { UploadProps } from 'antd'
import { UploadCloud, RefreshCw, Trash2, RotateCw } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import ApiErrorBanner from '../components/ApiErrorBanner'
import { useAsyncList } from '../hooks/useAsyncList'
import { deletePaper, listPapers, reprocessPaper, uploadPaper, type PaperInfo } from '../../client/api/papers'
import { ApiError } from '../../client/api/http'
import type { PaperStatus } from '../../types'

const STATUS_MAP: Record<PaperStatus, { color: string; label: string }> = {
  done: { color: 'success', label: 'Hoàn tất' },
  processing: { color: 'gold', label: 'Đang xử lý' },
  pending: { color: 'default', label: 'Chờ xử lý' },
  failed: { color: 'error', label: 'Lỗi' },
}

const hasActive = (items: PaperInfo[]) => items.some((p) => p.status === 'pending' || p.status === 'processing')

export default function PapersPage() {
  const { message } = AntApp.useApp()
  const [uploadOpen, setUploadOpen] = useState(false)
  const loader = useCallback(() => listPapers({ limit: 200 }), [])
  const { items, total, loading, error, reload } = useAsyncList(loader, { pollMs: 3000, shouldPoll: hasActive })

  const uploadProps: UploadProps = {
    multiple: true,
    accept: '.pdf,application/pdf',
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const info = await uploadPaper(file as File)
        message.success(`Đã nhận "${info.filename}" — đang đưa vào hàng đợi xử lý.`)
        onSuccess?.(info)
        void reload(true)
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Tải lên thất bại.'
        message.error(msg)
        onError?.(new Error(msg))
      }
    },
  }

  const reprocess = async (id: string) => {
    try {
      await reprocessPaper(id)
      message.info('Đã đưa tài liệu vào hàng đợi xử lý lại.')
      void reload(true)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Không xử lý lại được.')
    }
  }

  const remove = async (id: string) => {
    try {
      await deletePaper(id)
      message.success('Đã xoá tài liệu, vector và file PDF.')
      void reload(true)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Không xoá được tài liệu.')
    }
  }

  return (
    <div>
      <PageHeader
        title="Nguồn tài liệu"
        description={`${total} PDF trong kho. Pipeline: parse → chunk → embed (BGE-M3) → index Qdrant; bảng tự làm mới khi còn tài liệu đang xử lý.`}
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<RotateCw size={14} style={{ marginRight: 4 }} />} onClick={() => void reload()} loading={loading}>
              Làm mới
            </Button>
            <Button type="primary" icon={<UploadCloud size={14} style={{ marginRight: 4 }} />} onClick={() => setUploadOpen(true)}>
              Tải tài liệu lên
            </Button>
          </div>
        }
      />

      <ApiErrorBanner error={error} onRetry={() => void reload()} />

      <div className="admin-card">
        <Table
          rowKey="id"
          loading={loading && items.length === 0}
          dataSource={items}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{ emptyText: 'Chưa có tài liệu nào. Tải PDF lên để bắt đầu.' }}
          columns={[
            {
              title: 'Tên file',
              dataIndex: 'filename',
              render: (v: string, r: PaperInfo) => (
                <div>
                  <p style={{ margin: 0, fontWeight: 500 }}>{v}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-ink-muted)', fontFamily: 'monospace' }}>{r.id}</p>
                  {r.error && <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--color-danger)' }}>{r.error}</p>}
                </div>
              ),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 130,
              render: (status: PaperStatus) => <Tag color={STATUS_MAP[status].color}>{STATUS_MAP[status].label}</Tag>,
            },
            {
              title: 'Ngày tải lên',
              dataIndex: 'createdAt',
              width: 170,
              render: (v: string | null) => (v ? new Date(v).toLocaleString('vi-VN') : '—'),
            },
            {
              title: '',
              key: 'actions',
              width: 100,
              render: (_: unknown, r: PaperInfo) => (
                <div style={{ display: 'flex', gap: 4 }}>
                  <Tooltip title="Xử lý lại (parse → embed)">
                    <Button
                      type="text"
                      size="small"
                      icon={<RefreshCw size={14} />}
                      disabled={r.status === 'processing'}
                      onClick={() => void reprocess(r.id)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Xoá tài liệu này?"
                    description="Xoá file PDF, vector trong Qdrant và bản ghi. Không thể hoàn tác."
                    okText="Xoá"
                    cancelText="Huỷ"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => void remove(r.id)}
                  >
                    <Tooltip title="Xoá">
                      <Button type="text" size="small" danger icon={<Trash2 size={14} />} />
                    </Tooltip>
                  </Popconfirm>
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
          <p style={{ fontSize: 11.5, color: 'var(--color-ink-muted)' }}>Chỉ hỗ trợ .pdf, giới hạn theo MAX_UPLOAD_MB của backend</p>
        </Upload.Dragger>
      </Modal>
    </div>
  )
}
