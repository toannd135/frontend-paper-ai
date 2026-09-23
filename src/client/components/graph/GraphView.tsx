import { useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph3D, { type ForceGraph3DInstance, type NodeObject, type LinkObject } from '3d-force-graph'
import SpriteText from 'three-spritetext'
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
  Sun,
  Moon,
  X,
  ExternalLink,
  Keyboard,
  SlidersHorizontal,
  Waypoints,
  Share2,
} from 'lucide-react'
import { useApp } from '../../state/AppContext'
import { mockSourceRelations } from '../../../data/mock'
import { buildGraph3DElements, truncateLabel, nodeValue, type GraphTheme, type Graph3DNode, type Graph3DLink } from './graphData'
import type { SourceFilter } from '../../../types'

const GLOBAL_FILTERS: { key: SourceFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'selected', label: 'Selected' },
  { key: 'high', label: 'High relevance' },
  { key: 'recent', label: 'Recent' },
]

const BG_LIGHT = '#fff8e8'
const BG_DARK = '#12211f'

export default function GraphView() {
  const { state, setSourceSearch, setSourceFilter, toggleSelectSource, openPaperModal } = useApp()

  const [theme, setTheme] = useState<GraphTheme>('light')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set())
  const [yearFilter, setYearFilter] = useState<Set<number>>(new Set())
  const [minRelevance, setMinRelevance] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  // 3d-force-graph's exported constructor isn't itself generic (only the returned
  // instance type is), so the engine is kept typed as its default NodeObject/LinkObject
  // and our richer Graph3DNode/Graph3DLink fields are accessed via casts at each callback.
  const fgRef = useRef<ForceGraph3DInstance | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const asNode = (n: NodeObject) => n as unknown as Graph3DNode
  const asLink = (l: LinkObject<NodeObject>) => l as unknown as Graph3DLink

  const selectedSource = state.sources.find((s) => s.id === selectedId) || null

  const allTypes = useMemo(() => Array.from(new Set(state.sources.map((s) => s.type))), [state.sources])
  const allYears = useMemo(
    () => Array.from(new Set(state.sources.map((s) => s.year))).sort((a, b) => a - b),
    [state.sources],
  )

  const relatedRelations = useMemo(
    () => mockSourceRelations.filter((r) => r.source === selectedId || r.target === selectedId),
    [selectedId],
  )

  const excludedIds = useMemo(() => {
    const q = state.sourceSearch.trim().toLowerCase()
    const excluded = new Set<string>()
    state.sources.forEach((s) => {
      let ok = true
      if (q && !s.title.toLowerCase().includes(q) && !s.authors.toLowerCase().includes(q)) ok = false
      if (state.sourceFilter === 'selected' && !state.selectedIds.has(s.id)) ok = false
      if (state.sourceFilter === 'high' && s.relevance < 85) ok = false
      if (state.sourceFilter === 'recent' && s.year < 2024) ok = false
      if (typeFilter.size > 0 && !typeFilter.has(s.type)) ok = false
      if (yearFilter.size > 0 && !yearFilter.has(s.year)) ok = false
      if (s.relevance < minRelevance) ok = false
      if (!ok) excluded.add(s.id)
    })
    return excluded
  }, [state.sources, state.sourceSearch, state.sourceFilter, state.selectedIds, typeFilter, yearFilter, minRelevance])

  const graphData = useMemo(
    () =>
      buildGraph3DElements({
        sources: state.sources,
        relations: mockSourceRelations,
        theme,
        selectedId,
        excludedIds,
      }),
    [state.sources, theme, selectedId, excludedIds],
  )

  // Create the 3D engine once. Drag-to-rotate/orbit and scroll-to-zoom come for
  // free from the library's built-in orbit controls.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const fg = new ForceGraph3D(el)
      .nodeId('id')
      .nodeVal((n) => asNode(n).__val)
      .nodeColor((n) => asNode(n).__color)
      .nodeLabel((n) => `${asNode(n).source.title} — ${asNode(n).source.authors}`)
      .nodeRelSize(4)
      .nodeThreeObjectExtend(true)
      .nodeThreeObject((n) => {
        const source = asNode(n).source
        const sprite = new SpriteText(truncateLabel(source.title, 28))
        // A solid chip behind the text guarantees contrast no matter the theme or
        // whatever node/edge color happens to sit behind the label in 3D space —
        // relying on the canvas background color alone made labels unreadable.
        sprite.color = '#ffffff'
        sprite.backgroundColor = 'rgba(20, 22, 20, 0.78)'
        sprite.padding = [3, 5]
        sprite.borderRadius = 3
        sprite.fontWeight = 'bold'
        sprite.textHeight = 2.8
        sprite.position.y = -(Math.cbrt(nodeValue(source.citations)) * 4 + 5)
        return sprite
      })
      .linkSource('source')
      .linkTarget('target')
      .linkColor((l) => asLink(l).__color)
      .linkWidth((l) => asLink(l).__width)
      .linkDirectionalArrowLength((l) => (asLink(l).kind === 'cites' ? 3 : 0))
      .linkDirectionalArrowRelPos(1)
      .linkDirectionalParticles((l) => asLink(l).__particles)
      .linkDirectionalParticleWidth(1.6)
      .linkCurvature(0.15)
      .onNodeClick((n) => {
        const id = asNode(n).id
        setSelectedId((prev) => (prev === id ? null : id))
      })
      .onBackgroundClick(() => setSelectedId(null))
      .showNavInfo(false)

    fgRef.current = fg

    const ro = new ResizeObserver(() => {
      if (!el) return
      fg.width(el.clientWidth).height(el.clientHeight)
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      fg._destructor()
      fgRef.current = null
    }
  }, [])

  // Push data updates. three-forcegraph merges by node id and preserves existing
  // x/y/z, so re-supplying the full (re-styled) dataset does not reshuffle the layout.
  useEffect(() => {
    fgRef.current?.graphData({ nodes: graphData.nodes, links: graphData.links })
  }, [graphData])

  useEffect(() => {
    fgRef.current?.backgroundColor(theme === 'dark' ? BG_DARK : BG_LIGHT)
  }, [theme])

  const zoomBy = (factor: number) => {
    const fg = fgRef.current
    if (!fg) return
    const { x, y, z } = fg.cameraPosition()
    fg.cameraPosition({ x: x * factor, y: y * factor, z: z * factor }, undefined, 300)
  }
  const fitView = () => fgRef.current?.zoomToFit(600, 60)

  // Keyboard shortcuts.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA'

      if (e.key === '/' && !isTyping) {
        e.preventDefault()
        searchInputRef.current?.focus()
        return
      }
      if (e.key === 'Escape') {
        if (isTyping) (target as HTMLInputElement).blur()
        setShowShortcuts(false)
        setSelectedId(null)
        return
      }
      if (isTyping) return
      if (e.key === '+' || e.key === '=') {
        zoomBy(0.8)
      } else if (e.key === '-') {
        zoomBy(1.25)
      } else if (e.key === 'f' || e.key === 'F') {
        fitView()
      } else if (e.key === '?') {
        setShowShortcuts((v) => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const toggleTypeFilter = (t: string) => {
    setTypeFilter((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }
  const toggleYearFilter = (y: number) => {
    setYearFilter((prev) => {
      const next = new Set(prev)
      if (next.has(y)) next.delete(y)
      else next.add(y)
      return next
    })
  }

  const findSourceTitle = (id: string) => state.sources.find((s) => s.id === id)?.title ?? id

  return (
    <div className="graph-view" data-theme={theme}>
      <div className="graph-toolbar">
        <div className="graph-toolbar-left">
          <div className="graph-search">
            <Search size={14} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tìm theo tiêu đề hoặc tác giả... ( / )"
              value={state.sourceSearch}
              onChange={(e) => setSourceSearch(e.target.value)}
            />
          </div>
          <div className="filter-chip-row">
            {GLOBAL_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`filter-chip${state.sourceFilter === f.key ? ' active' : ''}`}
                onClick={() => setSourceFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            className={`toolbar-btn graph-filters-toggle${filtersOpen ? ' active' : ''}`}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <SlidersHorizontal size={14} /> Bộ lọc
          </button>
        </div>

        <div className="graph-toolbar-right">
          <button className="icon-btn" onClick={() => zoomBy(1.25)} aria-label="Thu nhỏ">
            <ZoomOut size={16} />
          </button>
          <button className="icon-btn" onClick={() => zoomBy(0.8)} aria-label="Phóng to">
            <ZoomIn size={16} />
          </button>
          <button className="icon-btn" onClick={fitView} aria-label="Vừa khung hình">
            <Maximize size={16} />
          </button>
          <button
            className="icon-btn"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            aria-label="Đổi giao diện sáng/tối"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button className="icon-btn" onClick={() => setShowShortcuts(true)} aria-label="Phím tắt">
            <Keyboard size={16} />
          </button>
        </div>
      </div>

      <div className="graph-body">
        <div className={`graph-filters-panel${filtersOpen ? ' open' : ''}`}>
          <div className="graph-filters-head">
            <h4>Bộ lọc đồ thị</h4>
            <button className="icon-btn" onClick={() => setFiltersOpen(false)} aria-label="Đóng bộ lọc">
              <X size={16} />
            </button>
          </div>

          <div className="graph-filter-group">
            <p className="graph-filter-label">Loại nguồn</p>
            <div className="filter-chip-row wrap">
              {allTypes.map((t) => (
                <button
                  key={t}
                  className={`filter-chip small${typeFilter.has(t) ? ' active' : ''}`}
                  onClick={() => toggleTypeFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="graph-filter-group">
            <p className="graph-filter-label">Năm xuất bản</p>
            <div className="filter-chip-row wrap">
              {allYears.map((y) => (
                <button
                  key={y}
                  className={`filter-chip small${yearFilter.has(y) ? ' active' : ''}`}
                  onClick={() => toggleYearFilter(y)}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div className="graph-filter-group">
            <p className="graph-filter-label">
              Relevance tối thiểu <strong>{minRelevance}%</strong>
            </p>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={minRelevance}
              onChange={(e) => setMinRelevance(Number(e.target.value))}
              className="graph-range"
            />
          </div>

          <div className="graph-legend">
            <p className="graph-filter-label">Chú giải</p>
            <div className="graph-legend-row">
              <span className="legend-swatch legend-swatch-gold" /> Relevance thấp
            </div>
            <div className="graph-legend-row">
              <span className="legend-swatch legend-swatch-teal" /> Relevance cao
            </div>
            <div className="graph-legend-row">
              <span className="legend-line legend-line-solid" /> Trích dẫn (cites)
            </div>
            <div className="graph-legend-row">
              <span className="legend-line legend-line-dashed" /> Cùng chủ đề (related)
            </div>
            <p className="graph-legend-note">
              Kích thước node tỷ lệ theo số lượt trích dẫn. Kéo chuột để xoay, cuộn để zoom.
            </p>
          </div>
        </div>

        <div className="graph-canvas-wrap">
          {state.sources.length === 0 ? (
            <div className="graph-empty">
              <Waypoints size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
              <p>Sơ đồ liên kết nguồn sẽ xuất hiện tại đây sau khi bạn bắt đầu nghiên cứu.</p>
            </div>
          ) : (
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
          )}
        </div>

        {selectedSource && (
          <aside className="graph-detail-panel">
            <div className="graph-detail-head">
              <span className="graph-detail-type">{selectedSource.type}</span>
              <button className="icon-btn" onClick={() => setSelectedId(null)} aria-label="Đóng">
                <X size={16} />
              </button>
            </div>
            <h3 className="graph-detail-title">{selectedSource.title}</h3>
            <p className="graph-detail-authors">{selectedSource.authors}</p>

            <div className="graph-detail-grid">
              <div>
                <p className="g-label">Năm</p>
                <p className="g-value">{selectedSource.year}</p>
              </div>
              <div>
                <p className="g-label">Nhà xuất bản</p>
                <p className="g-value">{selectedSource.publisher}</p>
              </div>
              <div>
                <p className="g-label">Trích dẫn</p>
                <p className="g-value">{selectedSource.citations}</p>
              </div>
              <div>
                <p className="g-label">Relevance</p>
                <p className="g-value">{selectedSource.relevance}%</p>
              </div>
            </div>

            <div className="graph-detail-section">
              <p className="graph-filter-label">Liên kết ({relatedRelations.length})</p>
              {relatedRelations.length === 0 ? (
                <p className="graph-detail-empty-note">Không tìm thấy liên kết nào với nguồn khác.</p>
              ) : (
                <ul className="graph-related-list">
                  {relatedRelations.map((r) => {
                    const otherId = r.source === selectedId ? r.target : r.source
                    return (
                      <li key={`${r.source}-${r.target}`}>
                        <button className="graph-related-item" onClick={() => setSelectedId(otherId)}>
                          <span className={`related-kind-dot ${r.kind}`} />
                          <span className="graph-related-title">{findSourceTitle(otherId)}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="graph-detail-actions">
              <button
                className={`toolbar-btn${state.selectedIds.has(selectedSource.id) ? '' : ' primary'}`}
                onClick={() => toggleSelectSource(selectedSource.id)}
              >
                {state.selectedIds.has(selectedSource.id) ? 'Bỏ khỏi nghiên cứu' : 'Thêm vào nghiên cứu'}
              </button>
              <button className="toolbar-btn link" onClick={() => openPaperModal(selectedSource.id)}>
                <ExternalLink size={14} /> Xem chi tiết
              </button>
            </div>
          </aside>
        )}
      </div>

      {showShortcuts && (
        <div className="graph-shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="graph-shortcuts-card" onClick={(e) => e.stopPropagation()}>
            <div className="graph-filters-head">
              <h4>
                <Share2 size={15} style={{ marginRight: 6, verticalAlign: -2 }} /> Phím tắt
              </h4>
              <button className="icon-btn" onClick={() => setShowShortcuts(false)} aria-label="Đóng">
                <X size={16} />
              </button>
            </div>
            <ul className="graph-shortcuts-list">
              <li>Kéo chuột: xoay góc nhìn 3D</li>
              <li>Cuộn chuột: zoom in/out</li>
              <li>
                <kbd>/</kbd> Focus ô tìm kiếm
              </li>
              <li>
                <kbd>+</kbd> / <kbd>-</kbd> Phóng to / Thu nhỏ
              </li>
              <li>
                <kbd>F</kbd> Vừa khung hình
              </li>
              <li>
                <kbd>Esc</kbd> Bỏ chọn / đóng panel
              </li>
              <li>
                <kbd>?</kbd> Bật/tắt bảng này
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
