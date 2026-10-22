import { Menu, PanelLeft, Library } from 'lucide-react'
import type { ActiveTab, Stage } from '../../types'

interface HeaderProps {
  title: string
  subtitle: string
  stage: Stage
  activeTab: ActiveTab
  sourceCount: number
  hasReport: boolean
  onOpenSidebarDrawer: () => void
  onToggleSidebarCollapse: () => void
  onSetActiveTab: (tab: ActiveTab) => void
  onOpenSourcesDrawer: () => void
  sourcesPanelOpen: boolean
  onToggleSourcesPanel: () => void
}

export default function Header({
  title,
  subtitle,
  stage,
  activeTab,
  sourceCount,
  hasReport,
  onOpenSidebarDrawer,
  onToggleSidebarCollapse,
  onSetActiveTab,
  onOpenSourcesDrawer,
  sourcesPanelOpen,
  onToggleSourcesPanel,
}: HeaderProps) {
  const showResearchTab = sourceCount > 0 || hasReport
  const showArticleTab = stage === 'article' || hasReport
  const showGraphTab = sourceCount > 0
  const showModeTabs = showResearchTab || showArticleTab || showGraphTab

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
        <div className="mode-tabs" role="tablist" aria-label="Chế độ xem">
          {showResearchTab && (
            <button
              role="tab"
              aria-selected={activeTab === 'research'}
              onClick={() => onSetActiveTab('research')}
              className={`mode-tab${activeTab === 'research' ? ' active' : ''}`}
            >
              Research
            </button>
          )}
          {showArticleTab && (
            <button
              role="tab"
              aria-selected={activeTab === 'article'}
              onClick={() => onSetActiveTab('article')}
              className={`mode-tab${activeTab === 'article' ? ' active' : ''}`}
            >
              Article
            </button>
          )}
          {showGraphTab && (
            <button
              role="tab"
              aria-selected={activeTab === 'graph'}
              onClick={() => onSetActiveTab('graph')}
              className={`mode-tab${activeTab === 'graph' ? ' active' : ''}`}
            >
              Graph
            </button>
          )}
        </div>
      )}

      <div className="app-header-right">
        {stage !== 'initial' && !sourcesPanelOpen && (
          <button
            onClick={onToggleSourcesPanel}
            className="sources-mobile-btn sources-desktop-btn"
            title="Hiện nguồn tài liệu"
            aria-label="Hiện nguồn tài liệu"
          >
            <Library size={14} /> <span>Nguồn tài liệu</span>
            {sourceCount > 0 && <span className="sources-desktop-count">{sourceCount}</span>}
          </button>
        )}
        <button onClick={onOpenSourcesDrawer} className="sources-mobile-btn" aria-label="Mở nguồn tài liệu">
          <Library size={14} /> <span>{sourceCount}</span>
        </button>
      </div>
    </header>
  )
}
