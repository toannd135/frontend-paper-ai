import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Popconfirm } from 'antd'
import { Plus, Search, X, FileStack, LayoutDashboard, Trash2, Loader2, CheckCircle2, AlertCircle, Clock3 } from 'lucide-react'
import type { ResearchHistoryItem } from '../../types'
import logo from '../../assets/logo.png'

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  history: ResearchHistoryItem[]
  historyLoading: boolean
  historyError: string | null
  activeTaskId: string | null
  onSelectTask: (id: string) => void
  onDeleteTask: (id: string) => void
  onNewResearch: () => void
  onCloseMobile: () => void
}

function groupLabel(iso: string, now: Date): string {
  const d = new Date(iso)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.floor((startOfToday.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000)
  if (diffDays <= 0) return 'Hôm nay'
  if (diffDays === 1) return 'Hôm qua'
  if (diffDays < 7) return '7 ngày qua'
  if (diffDays < 30) return '30 ngày qua'
  return 'Cũ hơn'
}

const GROUP_ORDER = ['Hôm nay', 'Hôm qua', '7 ngày qua', '30 ngày qua', 'Cũ hơn']

function StatusIcon({ status }: { status: ResearchHistoryItem['status'] }) {
  if (status === 'done') return <CheckCircle2 size={14} strokeWidth={1.8} className="conv-status done" />
  if (status === 'failed') return <AlertCircle size={14} strokeWidth={1.8} className="conv-status failed" />
  if (status === 'processing') return <Loader2 size={14} strokeWidth={1.8} className="conv-status spin" />
  return <Clock3 size={14} strokeWidth={1.8} className="conv-status" />
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  history,
  historyLoading,
  historyError,
  activeTaskId,
  onSelectTask,
  onDeleteTask,
  onNewResearch,
  onCloseMobile,
}: SidebarProps) {
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const now = new Date()
    const q = query.trim().toLowerCase()
    const filtered = q ? history.filter((h) => h.question.toLowerCase().includes(q)) : history
    const map = new Map<string, ResearchHistoryItem[]>()
    filtered.forEach((h) => {
      const label = groupLabel(h.createdAt, now)
      map.set(label, [...(map.get(label) ?? []), h])
    })
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => [g, map.get(g)!] as const)
  }, [history, query])

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img src={logo} alt="PaperAI logo" />
          </div>
          <div className="sidebar-brand-text sidebar-label">
            <p>PaperAI</p>
            <p>AI Research Assistant</p>
          </div>
        </div>
        <button onClick={onCloseMobile} className="icon-btn sidebar-mobile-close" aria-label="Đóng menu">
          <X size={18} color="#fff" />
        </button>
      </div>

      <div className="sidebar-new-wrap">
        <button onClick={onNewResearch} title="Bài nghiên cứu mới" className="sidebar-footer-btn sidebar-new-btn">
          <Plus size={16} />
          <span className="sidebar-label">Bài nghiên cứu mới</span>
        </button>
      </div>

      <div className="sidebar-quicknav">
        <Link to="/admin/papers" className="sidebar-footer-btn" title="Tài liệu đã tải lên">
          <FileStack size={16} />
          <span className="sidebar-label">Tài liệu đã tải</span>
        </Link>
        <Link to="/admin" className="sidebar-footer-btn" title="Trang quản trị">
          <LayoutDashboard size={16} />
          <span className="sidebar-label">Quản trị</span>
        </Link>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-search-wrap sidebar-label">
        <div className="sidebar-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Tìm trong lịch sử..."
            aria-label="Tìm trong lịch sử nghiên cứu"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <nav className="sidebar-nav sidebar-scrollbar" aria-label="Lịch sử nghiên cứu">
        {historyLoading && history.length === 0 && (
          <p className="conv-group-label sidebar-label">Đang tải lịch sử…</p>
        )}
        {historyError && <p className="conv-group-label sidebar-label conv-error">{historyError}</p>}
        {!historyLoading && !historyError && history.length === 0 && (
          <p className="conv-empty sidebar-label">Chưa có phiên nghiên cứu nào. Hãy bắt đầu với một chủ đề.</p>
        )}
        {groups.map(([group, items]) => (
          <div key={group} style={{ marginBottom: 12 }}>
            <p className="conv-group-label sidebar-label">{group}</p>
            {items.map((h) => (
              <div key={h.id} className={`conv-item-row${h.id === activeTaskId ? ' active' : ''}`}>
                <button
                  title={h.question}
                  onClick={() => onSelectTask(h.id)}
                  className={`conv-item${h.id === activeTaskId ? ' active' : ''}`}
                >
                  <StatusIcon status={h.status} />
                  <span className="sidebar-label conv-item-title">{h.question}</span>
                </button>
                <Popconfirm
                  title="Xoá phiên nghiên cứu này?"
                  description="Báo cáo và trích dẫn sẽ bị xoá khỏi máy chủ."
                  okText="Xoá"
                  cancelText="Huỷ"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => onDeleteTask(h.id)}
                >
                  <button className="conv-delete sidebar-label" aria-label="Xoá phiên nghiên cứu" disabled={h.status === 'processing'}>
                    <Trash2 size={13} />
                  </button>
                </Popconfirm>
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-row">
          <div className="sidebar-user" title="Phiên làm việc cục bộ — hệ thống chưa có đăng nhập">
            <div className="sidebar-avatar">P</div>
            <div className="sidebar-user-text sidebar-label">
              <p>Phiên cục bộ</p>
              <p>Chưa có đăng nhập</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
