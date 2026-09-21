import { Library, Search, PanelRight } from 'lucide-react'
import { useApp } from '../state/AppContext'
import SourceCard from './SourceCard'
import type { SourceFilter } from '../../types'

const FILTERS: { key: SourceFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'selected', label: 'Selected' },
  { key: 'high', label: 'High relevance' },
  { key: 'recent', label: 'Recent' },
]

interface SourcesPanelProps {
  mobileOpen: boolean
  onCloseDrawer: () => void
}

export default function SourcesPanel({ mobileOpen, onCloseDrawer }: SourcesPanelProps) {
  const {
    state,
    setSourceFilter,
    setSourceSearch,
    setSourceSort,
    toggleSelectSource,
    openPaperModal,
    toggleSourcesPanel,
  } = useApp()

  let items = [...state.sources]
  const q = state.sourceSearch.toLowerCase()
  if (q) {
    items = items.filter(
      (p) => p.title.toLowerCase().includes(q) || p.authors.toLowerCase().includes(q),
    )
  }
  if (state.sourceFilter === 'selected') items = items.filter((p) => state.selectedIds.has(p.id))
  if (state.sourceFilter === 'high') items = items.filter((p) => p.relevance >= 85)
  if (state.sourceFilter === 'recent') items = items.filter((p) => p.year >= 2024)

  if (state.sourceSort === 'relevance') items.sort((a, b) => b.relevance - a.relevance)
  if (state.sourceSort === 'year') items.sort((a, b) => b.year - a.year)
  if (state.sourceSort === 'citation') items.sort((a, b) => b.citations - a.citations)

  return (
    <aside className={`sources-panel${mobileOpen ? ' mobile-open' : ''}`}>
      <div className="sources-panel-head">
        <div className="sources-panel-title">
          <div className="sources-panel-title-left">
            <Library size={16} color="var(--color-primary)" />
            <h3>Research Sources</h3>
            <span className="sources-count-badge">{state.sources.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="icon-btn sources-mobile-close" onClick={onCloseDrawer} aria-label="Đóng">
              ✕
            </button>
            <button className="icon-btn sources-collapse-btn" onClick={toggleSourcesPanel} aria-label="Thu gọn panel">
              <PanelRight size={16} />
            </button>
          </div>
        </div>

        <div className="sources-search">
          <Search size={14} color="var(--color-ink-muted)" />
          <input
            type="text"
            placeholder="Search papers..."
            value={state.sourceSearch}
            onChange={(e) => setSourceSearch(e.target.value)}
          />
        </div>

        <div className="filter-chip-row">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter-chip${state.sourceFilter === f.key ? ' active' : ''}`}
              onClick={() => setSourceFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="sort-row">
          <span>Sort:</span>
          <select
            value={state.sourceSort}
            onChange={(e) => setSourceSort(e.target.value as typeof state.sourceSort)}
            style={{
              background: '#fff',
              border: '1px solid var(--color-hairline)',
              borderRadius: 7,
              padding: '4px 6px',
              fontSize: '11.5px',
              outline: 'none',
            }}
          >
            <option value="relevance">Relevance</option>
            <option value="year">Year</option>
            <option value="citation">Citation</option>
          </select>
        </div>
      </div>

      <div className="source-list-wrap scrollbar-thin">
        {state.sources.length === 0 ? (
          <div className="source-list-empty">
            <Library size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
            <p>Các nguồn học thuật sẽ xuất hiện tại đây sau khi bạn bắt đầu nghiên cứu.</p>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-ink-muted)', fontSize: 13 }}>
            Không tìm thấy nguồn phù hợp.
          </div>
        ) : (
          items.map((p) => (
            <SourceCard
              key={p.id}
              paper={p}
              selected={state.selectedIds.has(p.id)}
              flash={state.flashSourceId === p.id}
              onView={() => openPaperModal(p.id)}
              onToggleSelect={() => toggleSelectSource(p.id)}
            />
          ))
        )}
      </div>
    </aside>
  )
}
