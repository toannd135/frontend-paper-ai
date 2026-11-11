import { useCallback, useEffect, useState } from 'react'
import { App as AntApp, Input, Modal, Select, Tooltip } from 'antd'
import { FolderPlus } from 'lucide-react'
import { createWorkspace, listWorkspaces, type Workspace } from '../api/workspaces'
import { ApiError } from '../api/http'
import { getCurrentWorkspaceId, setCurrentWorkspaceId, useCurrentWorkspaceId } from '../state/workspaceStore'

const NONE = '__none__'

/** Chọn/tạo phiên nghiên cứu; áp cho lần upload PDF và lần nghiên cứu kế tiếp. */
export default function WorkspacePicker() {
  const { message } = AntApp.useApp()
  const currentId = useCurrentWorkspaceId()
  const [items, setItems] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listWorkspaces()
      setItems(list)
      // phiên đã lưu không còn (bị xoá / đổi tài khoản) -> bỏ chọn
      const stored = getCurrentWorkspaceId()
      if (stored && !list.some((w) => w.id === stored)) setCurrentWorkspaceId(null)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Không tải được danh sách kho dữ liệu riêng.')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    void reload()
  }, [reload])

  const submitCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      const ws = await createWorkspace(trimmed)
      setItems((prev) => [ws, ...prev])
      setCurrentWorkspaceId(ws.id)
      setCreating(false)
      setName('')
      message.success(`Đã tạo kho dữ liệu riêng "${ws.name}".`)
    } catch (err) {
      message.error(err instanceof ApiError ? err.message : 'Không tạo được kho dữ liệu riêng.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="workspace-picker sidebar-label">
      <div className="workspace-picker-row">
        <Tooltip
          placement="right"
          title="Chọn một kho dữ liệu riêng: chỉ dùng các PDF bạn đã tải vào kho đó, không tìm thêm trên mạng. Không chọn: dùng thư viện chung và tìm thêm bài trên mạng (OpenAlex)."
        >
          <Select
            size="small"
            className="workspace-select"
            loading={loading}
            value={currentId ?? NONE}
            onChange={(v) => setCurrentWorkspaceId(v === NONE ? null : v)}
            options={[
              { value: NONE, label: 'Thư viện chung (không chọn kho)' },
              ...items.map((w) => ({ value: w.id, label: w.name })),
            ]}
            popupMatchSelectWidth={false}
          />
        </Tooltip>
        <Tooltip title="Tạo kho dữ liệu riêng mới">
          <button className="icon-btn workspace-add" onClick={() => setCreating(true)} aria-label="Tạo kho dữ liệu riêng mới">
            <FolderPlus size={16} />
          </button>
        </Tooltip>
      </div>
      {currentId && <p className="workspace-hint">Chỉ dùng PDF trong kho này, không tìm thêm trên mạng.</p>}

      <Modal
        title="Tạo kho dữ liệu riêng"
        open={creating}
        okText="Tạo"
        cancelText="Huỷ"
        confirmLoading={saving}
        okButtonProps={{ disabled: !name.trim() }}
        onOk={() => void submitCreate()}
        onCancel={() => setCreating(false)}
        destroyOnHidden
      >
        <Input
          autoFocus
          maxLength={200}
          placeholder="Tên kho, ví dụ: Phân đoạn u não MRI"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onPressEnter={() => void submitCreate()}
        />
      </Modal>
    </div>
  )
}

