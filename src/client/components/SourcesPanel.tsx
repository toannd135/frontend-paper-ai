import { Library, Search, PanelRight } from 'lucide-react'
import { useApp } from '../state/AppContext'
import SourceCard from './SourceCard'
import type { SourceFilter } from '../../types'
import type { SourceSort } from '../state/appReducer'

const FILTERS: { key: SourceFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'high', label: 'Độ liên quan cao' },
  { key: 'recent', label: 'Mới nhất' },
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
    openPaperModal,
    toggleSourcesPanel,
  } = useApp()

  // Bỏ các nguồn hỏng dữ liệu (OpenAlex không trả tiêu đề)
  let items = state.sources.filter((p) => p.title && p.title !== 'Không có tiêu đề')
  const q = state.sourceSearch.toLowerCase()
  if (q) {
    items = items.filter(
      (p) => p.title.toLowerCase().includes(q) || p.authors.toLowerCase().includes(q),
    )
  }
  if (state.sourceFilter === 'high') items = items.filter((p) => p.relevance >= 85)
  if (state.sourceFilter === 'recent') items = items.filter((p) => p.year >= 2024)

  if (state.sourceSort === 'relevance') items.sort((a, b) => b.relevance - a.relevance)
  if (state.sourceSort === 'year') items.sort((a, b) => b.year - a.year)
  if (state.sourceSort === 'citation') items.sort((a, b) => b.citations - a.citations)

  return (
    <aside className={`sources-panel${mobileOpen ? ' mobile-open' : ''}${!state.sourcesPanelOpen ? ' collapsed' : ''}`}>
      <div className="sources-panel-head">
        <div className="sources-panel-title">
          <div className="sources-panel-title-left">
            <Library size={16} color="var(--color-primary)" />
            <h3>Nguồn tài liệu</h3>
            <span className="sources-count-badge">{state.sources.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="icon-btn sources-mobile-close" onClick={onCloseDrawer} aria-label="Đóng">
              ✕
            </button>
            <button className="icon-btn sources-collapse-btn" onClick={toggleSourcesPanel} aria-label="Thu gọn panel" title="Thu gọn panel">
              <PanelRight size={16} />
            </button>
          </div>
        </div>

        <div className="sources-search">
          <Search size={14} color="var(--color-ink-muted)" />
          <input
            type="text"
            placeholder="Tìm bài báo..."
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
          <span>Sắp xếp:</span>
          <select
            value={state.sourceSort}
            onChange={(e) => setSourceSort(e.target.value as SourceSort)}
            style={{
              background: '#fff',
              border: '1px solid var(--color-hairline)',
              borderRadius: 7,
              padding: '4px 6px',
              fontSize: '11.5px',
              outline: 'none',
            }}
          >
            <option value="relevance">Độ liên quan</option>
            <option value="year">Năm</option>
            <option value="citation">Trích dẫn</option>
          </select>
        </div>
      </div>

      <div className="source-list-wrap scrollbar-thin">
        {state.sources.length === 0 && state.stage !== 'researching' ? (
          <div className="source-list-empty">
            <div className="source-skeletons" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="source-skeleton" style={{ opacity: 1 - i * 0.28 }}>
                  <span className="sk-line w80" />
                  <span className="sk-line w50" />
                  <span className="sk-bar" />
                </div>
              ))}
              <Library size={44} className="source-skeleton-icon" />
            </div>
            <p>Các nguồn học thuật sẽ xuất hiện tại đây sau khi bạn bắt đầu nghiên cứu.</p>
          </div>
        ) : items.length === 0 && state.stage !== 'researching' ? (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px 0',
              color: 'var(--color-ink-muted)',
              fontSize: 13,
            }}
          >
            Không tìm thấy nguồn phù hợp.
          </div>
        ) : (
          items.map((p) => (
            <SourceCard
              key={p.id}
              paper={p}
              flash={state.flashSourceId === p.id}
              onView={() => openPaperModal(p.id)}
            />
          ))
        )}
        {state.stage === 'researching' &&
          [0, 1, 2].map((i) => (
            <div key={`sk-${i}`} className="source-skeleton live" aria-hidden="true">
              <span className="sk-line w80" />
              <span className="sk-line w50" />
              <span className="sk-bar" />
            </div>
          ))}
      </div>
    </aside>
  )
}
