import { Suspense, lazy, useState } from 'react'
import { AppProvider, useApp } from './state/AppContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import InitialState from './components/InitialState'
import ChatView from './components/chat/ChatView'
import ArticleView from './components/article/ArticleView'
import SourcesPanel from './components/SourcesPanel'
import PaperModal from './components/PaperModal'

// force-graph: chỉ tải khi người dùng mở tab Graph.
const GraphView = lazy(() => import('./components/graph/GraphView'))
import './ClientApp.css'

function Shell() {
  const {
    state,
    submitTopic,
    startNewResearch,
    startChatWithPaper,
    openResearchTask,
    removeResearchTask,
    setActiveTab,
    toggleSidebarCollapsed,
    toggleSourcesPanel,
  } = useApp()
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false)
  const [sourcesDrawerOpen, setSourcesDrawerOpen] = useState(false)


  const selectTask = (id: string) => {
    void openResearchTask(id)
    setSidebarDrawerOpen(false)
  }

  const newResearch = () => {
    startNewResearch()
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
        history={state.history}
        historyLoading={state.historyLoading}
        historyError={state.historyError}
        activeTaskId={state.researchTaskId}
        onSelectTask={selectTask}
        onDeleteTask={(id) => void removeResearchTask(id)}
        onNewResearch={newResearch}
        onCloseMobile={() => setSidebarDrawerOpen(false)}
      />

      <div className="main-column">
        <Header
          title={state.headerTitle}
          subtitle={state.headerSubtitle}
          stage={state.stage}
          activeTab={state.activeTab}
          sourceCount={state.sources.length}
          hasReport={!!state.report}
          onOpenSidebarDrawer={() => setSidebarDrawerOpen(true)}
          onToggleSidebarCollapse={toggleSidebarCollapsed}
          onSetActiveTab={setActiveTab}
          onOpenSourcesDrawer={() => setSourcesDrawerOpen(true)}
          sourcesPanelOpen={state.sourcesPanelOpen}
          onToggleSourcesPanel={toggleSourcesPanel}
        />

        <div className="content-row">
          <main className="workspace">
            {state.stage === 'initial' ? (
              <InitialState onSubmit={submitTopic} onUploadPaper={startChatWithPaper} />
            ) : state.activeTab === 'article' ? (
              <ArticleView />
            ) : state.activeTab === 'graph' ? (
              <Suspense fallback={<div className="lazy-fallback">Đang tải sơ đồ…</div>}>
                <GraphView />
              </Suspense>
            ) : (
              <ChatView />
            )}
          </main>

          <SourcesPanel mobileOpen={sourcesDrawerOpen} onCloseDrawer={() => setSourcesDrawerOpen(false)} />
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
