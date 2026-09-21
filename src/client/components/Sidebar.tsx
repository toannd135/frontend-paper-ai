import { Plus, Search, Settings, FileText, X } from 'lucide-react'
import { mockConversations } from '../../data/mock'
import logo from '../../assets/logo.png'

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  activeConversationId: string
  onSelectConversation: (id: string) => void
  onNewResearch: () => void
  onCloseMobile: () => void
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  activeConversationId,
  onSelectConversation,
  onNewResearch,
  onCloseMobile,
}: SidebarProps) {
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
        <button
          onClick={onNewResearch}
          title="Bài nghiên cứu mới"
          className="sidebar-footer-btn"
          style={{
            background: 'var(--color-gold)',
            color: '#fff',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '13.5px',
            padding: '10px',
          }}
        >
          <Plus size={16} />
          <span className="sidebar-label">Bài nghiên cứu mới</span>
        </button>
      </div>

      <div className="sidebar-search-wrap sidebar-label">
        <div className="sidebar-search">
          <Search size={14} />
          <input type="text" placeholder="Tìm cuộc trò chuyện..." aria-label="Tìm cuộc trò chuyện" />
        </div>
      </div>

      <nav className="sidebar-nav sidebar-scrollbar">
        {Object.entries(mockConversations).map(([group, items]) => (
          <div key={group} style={{ marginBottom: 12 }}>
            <p className="conv-group-label sidebar-label">{group}</p>
            {items.map((c) => (
              <button
                key={c.id}
                title={c.title}
                onClick={() => onSelectConversation(c.id)}
                className={`conv-item${c.id === activeConversationId ? ' active' : ''}`}
              >
                <FileText size={14} />
                <span className="sidebar-label" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.title}
                </span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-footer-btn" title="Cài đặt">
          <Settings size={16} />
          <span className="sidebar-label">Cài đặt</span>
        </button>
        <div className="sidebar-user" title="Nguyễn Văn A — Premium Plan">
          <div className="sidebar-avatar">NA</div>
          <div className="sidebar-user-text sidebar-label">
            <p>Nguyễn Văn A</p>
            <p>Premium Plan</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
