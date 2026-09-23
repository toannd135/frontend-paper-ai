import { useState } from 'react'
import { Library } from 'lucide-react'
import { AppProvider, useApp } from './state/AppContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import InitialState from './components/InitialState'
import ChatView from './components/chat/ChatView'
import ArticleView from './components/article/ArticleView'
import GraphView from './components/graph/GraphView'
import SourcesPanel from './components/SourcesPanel'
import PaperModal from './components/PaperModal'
import './ClientApp.css'

function Shell() {
  const { state, submitTopic, setActiveTab, toggleSidebarCollapsed, toggleSourcesPanel } = useApp()
  const [activeConversationId, setActiveConversationId] = useState('c1')
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false)
  const [sourcesDrawerOpen, setSourcesDrawerOpen] = useState(false)

  const startNewResearch = () => {
    window.location.reload()
  }

  const selectConversation = (id: string) => {
    setActiveConversationId(id)
    setSidebarDrawerOpen(false)
  }

  return (
    <div className="app-shell">
      {sidebarDrawerOpen && (
        <div className="mobile-backdrop sidebar-backdrop" onClick={() => setSidebarDrawerOpen(false)} />
      )}
      {sourcesDrawerOpen && (
        <div className="mobile-backdrop sources-backdrop" onClick={() => setSourcesDrawerOpen(false)} />
      )}

      <Sidebar
        collapsed={state.sidebarCollapsed}
        mobileOpen={sidebarDrawerOpen}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewResearch={startNewResearch}
        onCloseMobile={() => setSidebarDrawerOpen(false)}
      />

      <div className="main-column">
        <Header
          title={state.headerTitle}
          subtitle={state.headerSubtitle}
          stage={state.stage}
          activeTab={state.activeTab}
          sourceCount={state.sources.length}
          onOpenSidebarDrawer={() => setSidebarDrawerOpen(true)}
          onToggleSidebarCollapse={toggleSidebarCollapsed}
          onSetActiveTab={setActiveTab}
          onOpenSourcesDrawer={() => setSourcesDrawerOpen(true)}
        />

        <div className="content-row">
          <main className="workspace">
            {state.stage === 'initial' ? (
              <InitialState onSubmit={submitTopic} />
            ) : state.activeTab === 'article' ? (
              <ArticleView />
            ) : state.activeTab === 'graph' ? (
              <GraphView />
            ) : (
              <ChatView />
            )}
          </main>

          <SourcesPanel mobileOpen={sourcesDrawerOpen} onCloseDrawer={() => setSourcesDrawerOpen(false)} />
          {!state.sourcesPanelOpen && (
            <button
              className="sources-reopen-btn"
              onClick={toggleSourcesPanel}
              title="Hiện Research Sources"
              aria-label="Hiện Research Sources"
            >
              <Library size={16} />
            </button>
          )}
        </div>
      </div>

      <PaperModal />
    </div>
  )
}

export default function ClientApp() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
