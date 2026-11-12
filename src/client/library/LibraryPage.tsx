import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { App as AntApp, Button, Empty, Input, Modal, Popconfirm, Select, Table, Tag, Tooltip, Upload } from 'antd'
import { ArrowLeft, Database, FolderPlus, Library, MessageSquarePlus, RotateCcw, Trash2, UploadCloud } from 'lucide-react'
import {
  createWorkspace,
  DOMAIN_OPTIONS,
  domainLabel,
  listWorkspaces,
  type Workspace,
  type WorkspaceDomain,
  updateWorkspaceDomain,
} from '../api/workspaces'
import { deletePaper, listPapers, reprocessPaper, uploadPaper, type PaperInfo } from '../api/papers'
import { ApiError } from '../api/http'
import { setCurrentWorkspaceId, useCurrentWorkspaceId } from '../state/workspaceStore'
import type { PaperStatus } from '../../types'
import './LibraryPage.css'

const POLL_MS = 4000

const STATUS: Record<PaperStatus, { color: string; label: string }> = {
  pending: { color: 'default', label: 'Đang chờ xử lý' },
  processing: { color: 'processing', label: 'Đang xử lý' },
  done: { color: 'success', label: 'Sẵn sàng' },
  failed: { color: 'error', label: 'Lỗi' },
}

const errText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback)

/**
 * Trang "Kho dữ liệu": tạo kho riêng, tải nhiều PDF vào kho, xem trạng thái xử lý.
 * Kho chọn ở đây cũng là kho dùng cho lần nghiên cứu kế tiếp (chung workspaceStore với Sidebar).
 */
export default function LibraryPage() {
  const { message } = AntApp.useApp()
  const currentId = useCurrentWorkspaceId()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [papers, setPapers] = useState<PaperInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(0)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [domain, setDomain] = useState<WorkspaceDomain>('mri_brain')
  const [saving, setSaving] = useState(false)
  const timer = useRef<number | null>(null)

  const current = workspaces.find((w) => w.id === currentId) ?? null

  useEffect(() => {
    listWorkspaces()
      .then((list) => {
        setWorkspaces(list)
        if (currentId && !list.some((w) => w.id === currentId)) setCurrentWorkspaceId(null)
      })
      .catch((err) => message.error(errText(err, 'Không tải được danh sách kho.')))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message])

  const loadPapers = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const { items } = await listPapers({ limit: 200, workspaceId: currentId })
        setPapers(items)
      } catch (err) {
        if (!silent) message.error(errText(err, 'Không tải được danh sách tài liệu.'))
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [currentId, message],
  )

  useEffect(() => {
    void loadPapers()
  }, [loadPapers])

  // Tự làm mới khi còn tài liệu đang chờ/đang xử lý.
  useEffect(() => {
    const busy = papers.some((p) => p.status === 'pending' || p.status === 'processing')
    if (!busy) return
    timer.current = window.setTimeout(() => void loadPapers(true), POLL_MS)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [papers, loadPapers])

  const changeDomain = async (id: string, value: WorkspaceDomain) => {
    try {
      const ws = await updateWorkspaceDomain(id, value)
      setWorkspaces((prev) => prev.map((w) => (w.id === ws.id ? ws : w)))
      message.success(`Kho "${ws.name}" giờ là loại ${domainLabel(ws.domain)}.`)
    } catch (err) {
      message.error(errText(err, 'Không đổi được loại kho.'))
    }
  }

  const submitCreate = async () => {
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    try {
      const ws = await createWorkspace(name, domain)
      setWorkspaces((prev) => [ws, ...prev])
      setCurrentWorkspaceId(ws.id)
      setCreating(false)
      setNewName('')
      message.success(`Đã tạo kho "${ws.name}". Giờ bạn có thể kéo thả PDF vào.`)
    } catch (err) {
      message.error(errText(err, 'Không tạo được kho.'))
    } finally {
      setSaving(false)
    }
  }

  const upload = async (file: File) => {
    setUploading((n) => n + 1)
    try {
      await uploadPaper(file, currentId)
      await loadPapers(true)
    } catch (err) {
      message.error(`${file.name}: ${errText(err, 'Tải lên thất bại.')}`)
    } finally {
      setUploading((n) => n - 1)
    }
  }

  const remove = async (p: PaperInfo) => {
    try {
      await deletePaper(p.id)
      setPapers((prev) => prev.filter((x) => x.id !== p.id))
      message.success(`Đã xoá "${p.filename}".`)
    } catch (err) {
      message.error(errText(err, 'Không xoá được tài liệu.'))
    }
  }

  const retry = async (p: PaperInfo) => {
    try {
      await reprocessPaper(p.id)
      await loadPapers(true)
    } catch (err) {
      message.error(errText(err, 'Không xử lý lại được tài liệu.'))
    }
  }

  const readyCount = papers.filter((p) => p.status === 'done').length

  return (
    <div className="library-page">
      <header className="library-header">
        <Link to="/workspace" className="library-back">
          <ArrowLeft size={16} /> Quay lại nghiên cứu
        </Link>
        <h1>
          <Database size={20} /> Kho dữ liệu
        </h1>
        <p>Tạo kho riêng cho từng đề tài và tải PDF vào. Khi nghiên cứu với một kho, hệ thống chỉ dùng tài liệu trong kho đó.</p>
      </header>

      <div className="library-body">
        <aside className="library-list">
          <div className="library-list-head">
            <span>Kho của bạn</span>
            <Tooltip title="Tạo kho mới">
              <button className="icon-btn" onClick={() => setCreating(true)} aria-label="Tạo kho mới">
                <FolderPlus size={16} />
              </button>
            </Tooltip>
          </div>
          <button
            className={`library-item ${currentId === null ? 'active' : ''}`}
            onClick={() => setCurrentWorkspaceId(null)}
          >
            <Library size={15} />
            <span>Tất cả tài liệu</span>
          </button>
          {workspaces.map((w) => (
            <button
              key={w.id}
              className={`library-item ${currentId === w.id ? 'active' : ''}`}
              onClick={() => setCurrentWorkspaceId(w.id)}
            >
              <Database size={15} />
              <span>{w.name}</span>
              <Tag className="workspace-domain-tag">{domainLabel(w.domain)}</Tag>
            </button>
          ))}
          {workspaces.length === 0 && (
            <Button block type="dashed" icon={<FolderPlus size={14} />} onClick={() => setCreating(true)}>
              Tạo kho đầu tiên
            </Button>
          )}
        </aside>

        <section className="library-main">
          <div className="library-main-head">
            <div>
              <h2>{current ? current.name : 'Tất cả tài liệu'}</h2>
              <p>
                {papers.length} tài liệu · {readyCount} sẵn sàng
                {!current && ' · tài liệu tải lên ở đây sẽ vào thư viện chung'}
              </p>
            </div>
            <div className="library-main-actions">
            {current && (
              <Tooltip title="Loại kho quyết định bộ prompt khi nghiên cứu. Đổi loại áp cho lượt nghiên cứu sau, không ảnh hưởng lượt đang chạy.">
                <Select
                  className="workspace-domain-select"
                  style={{ minWidth: 190 }}
                  value={current.domain}
                  options={DOMAIN_OPTIONS.map((o) => ({ ...o, label: `Loại: ${o.label}` }))}
                  onChange={(v: WorkspaceDomain) => void changeDomain(current.id, v)}
                />
              </Tooltip>
            )}
            {current && (
              <Link to="/workspace">
                <Button type="primary" icon={<MessageSquarePlus size={15} />}>
                  Nghiên cứu với kho này
                </Button>
              </Link>
            )}
            </div>
          </div>

          <Upload.Dragger
            multiple
            accept="application/pdf"
            showUploadList={false}
            beforeUpload={(file) => {
              void upload(file)
              return false
            }}
            className="library-drop"
          >
            <UploadCloud size={32} className="library-drop-icon" />
            <p className="library-drop-title">
              {uploading > 0 ? `Đang tải lên ${uploading} file…` : 'Kéo thả PDF vào đây, hoặc bấm để chọn file'}
            </p>
            <p className="library-drop-sub">
              Chọn được nhiều file cùng lúc · tải vào <b>{current ? `kho "${current.name}"` : 'thư viện chung'}</b>
            </p>
          </Upload.Dragger>

          <Table<PaperInfo>
            rowKey="id"
            size="middle"
            loading={loading}
            dataSource={papers}
            pagination={papers.length > 20 ? { pageSize: 20 } : false}
            locale={{ emptyText: <Empty description="Chưa có tài liệu nào. Kéo thả PDF vào ô phía trên." /> }}
            columns={[
              { title: 'Tên file', dataIndex: 'filename', ellipsis: true },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                width: 150,
                render: (s: PaperStatus, p) => (
                  <Tooltip title={p.error ?? undefined}>
                    <Tag color={STATUS[s].color}>{STATUS[s].label}</Tag>
                  </Tooltip>
                ),
              },
              {
                title: 'Ngày tải',
                dataIndex: 'createdAt',
                width: 120,
                render: (d: string | null) => (d ? new Date(d).toLocaleDateString('vi-VN') : ''),
              },
              {
                title: '',
                width: 90,
                render: (_, p) => (
                  <span className="library-actions">
                    {p.status === 'failed' && (
                      <Tooltip title="Xử lý lại">
                        <button className="icon-btn" onClick={() => void retry(p)} aria-label="Xử lý lại">
                          <RotateCcw size={15} />
                        </button>
                      </Tooltip>
                    )}
                    <Popconfirm
                      title="Xoá tài liệu này?"
                      okText="Xoá"
                      cancelText="Huỷ"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => void remove(p)}
                    >
                      <button className="icon-btn" aria-label="Xoá tài liệu">
                        <Trash2 size={15} />
                      </button>
                    </Popconfirm>
                  </span>
                ),
              },
            ]}
          />
        </section>
      </div>

      <Modal
        title="Tạo kho dữ liệu riêng"
        open={creating}
        okText="Tạo"
        cancelText="Huỷ"
        confirmLoading={saving}
        okButtonProps={{ disabled: !newName.trim() }}
        onOk={() => void submitCreate()}
        onCancel={() => setCreating(false)}
        destroyOnHidden
      >
        <Input
          autoFocus
          maxLength={200}
          placeholder="Tên kho, ví dụ: Phân đoạn u não MRI"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onPressEnter={() => void submitCreate()}
        />
        <Select
          className="workspace-domain-select"
          style={{ width: '100%', marginTop: 12 }}
          value={domain}
          onChange={(v: WorkspaceDomain) => setDomain(v)}
          options={DOMAIN_OPTIONS}
        />
        <p className="workspace-hint">
          Loại kho quyết định bộ prompt khi nghiên cứu: MRI não chỉ dùng prompt MRI não, Deepfake chỉ dùng prompt deepfake. Không
          chọn kho thì hệ thống tìm trên OpenAlex với prompt chung.
        </p>
      </Modal>
    </div>
  )
}
