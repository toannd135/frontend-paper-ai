import { Menu, PanelLeft, Search, Share2, MoreHorizontal, Library } from 'lucide-react'
import type { ActiveTab, Stage } from '../../types'

interface HeaderProps {
  title: string
  subtitle: string
  stage: Stage
  activeTab: ActiveTab
  sourceCount: number
  onOpenSidebarDrawer: () => void
  onToggleSidebarCollapse: () => void
  onSetActiveTab: (tab: ActiveTab) => void
  onOpenSourcesDrawer: () => void
}

export default function Header({
  title,
  subtitle,
  stage,
  activeTab,
  sourceCount,
  onOpenSidebarDrawer,
  onToggleSidebarCollapse,
  onSetActiveTab,
  onOpenSourcesDrawer,
}: HeaderProps) {
  const showModeTabs = stage === 'article'

  return (
    <header className="app-header">
      <div className="app-header-left">
        <button onClick={onOpenSidebarDrawer} className="icon-btn header-hamburger" aria-label="Mở menu">
          <Menu size={20} />
        </button>
        <button
          onClick={onToggleSidebarCollapse}
          title="Thu gọn/mở rộng sidebar"
          aria-label="Thu gọn/mở rộng sidebar"
          className="icon-btn header-collapse-btn"
        >
          <PanelLeft size={18} />
        </button>
        <div className="header-titles">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      {showModeTabs && (
        <div className="mode-tabs">
          <button
            onClick={() => onSetActiveTab('research')}
            className={`mode-tab${activeTab === 'research' ? ' active' : ''}`}
          >
            Research
          </button>
          <button
            onClick={() => onSetActiveTab('article')}
            className={`mode-tab${activeTab === 'article' ? ' active' : ''}`}
          >
            Article
          </button>
        </div>
      )}

      <div className="app-header-right">
        <button className="icon-btn hide-mobile">
          <Search size={16} />
        </button>
        <button className="icon-btn hide-mobile">
          <Share2 size={16} />
        </button>
        <button className="icon-btn hide-mobile">
          <MoreHorizontal size={16} />
        </button>
        <button onClick={onOpenSourcesDrawer} className="sources-mobile-btn">
          <Library size={14} /> <span>{sourceCount}</span>
        </button>
        <div className="header-avatar">NA</div>
      </div>
    </header>
  )
}
