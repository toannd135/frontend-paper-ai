import { useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph, { type NodeObject, type LinkObject } from 'force-graph'
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize,
  X,
  ExternalLink,
  Keyboard,
  SlidersHorizontal,
  Waypoints,
  Share2,
} from 'lucide-react'
import { useApp } from '../../state/AppContext'
import { buildGraph3DElements, truncateLabel, type GraphTheme, type Graph3DNode, type Graph3DLink } from './graphData'
import type { SourceFilter } from '../../../types'

const GLOBAL_FILTERS: { key: SourceFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'high', label: 'Độ liên quan cao' },
  { key: 'recent', label: 'Recent' },
]

const newGraph = (el: HTMLElement) => new ForceGraph(el)

const BG_LIGHT = '#ffffff'

export default function GraphView() {
  const { state, setSourceSearch, setSourceFilter, openPaperModal } = useApp()

  const theme: GraphTheme = 'light'
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAuthors, setShowAuthors] = useState(false)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set())
  const [yearFilter, setYearFilter] = useState<Set<number>>(new Set())
  const [minRelevance, setMinRelevance] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  // force-graph's exported constructor isn't itself generic (only the returned
  // instance type is), so the engine is kept typed as its default NodeObject/LinkObject
  // and our richer Graph3DNode/Graph3DLink fields are accessed via casts at each callback.
  const fgRef = useRef<ReturnType<typeof newGraph> | null>(null)
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
    () => state.sourceRelations.filter((r) => r.source === selectedId || r.target === selectedId),
    [state.sourceRelations, selectedId],
  )

  const excludedIds = useMemo(() => {
    const q = state.sourceSearch.trim().toLowerCase()
    const excluded = new Set<string>()
    state.sources.forEach((s) => {
      let ok = true
      if (q && !s.title.toLowerCase().includes(q) && !s.authors.toLowerCase().includes(q)) ok = false
      if (state.sourceFilter === 'high' && s.relevance < 85) ok = false
      if (state.sourceFilter === 'recent' && s.year < 2024) ok = false
      if (typeFilter.size > 0 && !typeFilter.has(s.type)) ok = false
      if (yearFilter.size > 0 && !yearFilter.has(s.year)) ok = false
      if (s.relevance < minRelevance) ok = false
      if (!ok) excluded.add(s.id)
    })
    return excluded
  }, [state.sources, state.sourceSearch, state.sourceFilter, typeFilter, yearFilter, minRelevance])

  // Canvas callback chỉ tạo một lần nên đọc hover/selected qua ref.
  const labelFocusRef = useRef<{ hover: string | null; selected: string | null }>({ hover: null, selected: null })
  useEffect(() => {
    labelFocusRef.current = { hover: hoverId, selected: selectedId }
  }, [hoverId, selectedId])

  const graphData = useMemo(
    () =>
      buildGraph3DElements({
        sources: state.sources,
        relations: state.sourceRelations,
        theme,
        selectedId,
        excludedIds,
        hoverId,
        showAuthors,
      }),
    [state.sources, state.sourceRelations, theme, selectedId, excludedIds, hoverId, showAuthors],
  )

  // Create the 2D engine once. Drag-to-pan and scroll-to-zoom are built in.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const fg = newGraph(el)
      .nodeId('id')
      .nodeRelSize(4)
      .nodeVal((n) => asNode(n).__val)
      .nodeColor((n) => asNode(n).__color)
      .nodeLabel((n) => `${asNode(n).source.title} — ${asNode(n).source.authors}`)
      .nodeCanvasObjectMode(() => 'after')
      .nodeCanvasObject((n, ctx, scale) => {
        const node = asNode(n)
        const tier = node.__tier
        const fontSize = (tier === 'center' ? 13 : tier === 'mid' ? 11 : 10) / scale
        // Chỉ hiện nhãn cho node trung tâm, node đang hover hoặc đang được chọn; tiêu đề đầy đủ xem ở tooltip khi hover.
        const { hover, selected } = labelFocusRef.current
        if (node.id !== hover && node.id !== selected && tier !== 'center') return
        const text = truncateLabel(node.source.title, 22)
        ctx.font = `600 ${fontSize}px sans-serif`
        const w = ctx.measureText(text).width
        const x = n.x ?? 0
        const y = (n.y ?? 0) + Math.sqrt(node.__val) * 4 + 12 / scale + fontSize / 2
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)'
        ctx.fillRect(x - w / 2 - 2 / scale, y - fontSize / 2 - 1 / scale, w + 4 / scale, fontSize + 2 / scale)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#1f3b36'
        ctx.fillText(text, x, y)
      })
      .linkSource('source')
      .linkTarget('target')
      .linkColor((l) => asLink(l).__color)
      .linkWidth((l) => asLink(l).__width)
      .linkDirectionalArrowLength((l) => (asLink(l).kind === 'cites' ? 4 : 0))
      .linkDirectionalArrowRelPos(1)
      .linkDirectionalParticles((l) => asLink(l).__particles)
      .linkDirectionalParticleWidth(2)
      .linkCurvature(0.15)
      .linkLabel((l) => asLink(l).__label)
      .onNodeHover((n) => setHoverId(n ? asNode(n).id : null))
      .cooldownTime(4000)
      .onEngineStop(() => {
        if (!fitOnStopRef.current) return
        fitOnStopRef.current = false
        fg.zoomToFit(500, 110)
      })
      .onNodeClick((n) => {
        const id = asNode(n).id
        if (asNode(n).__kind === 'author') return
        setSelectedId((prev) => (prev === id ? null : id))
      })
      .onBackgroundClick(() => setSelectedId(null))

    // Đẩy node ra xa nhau để nhãn không đè lên nhau.
    fg.d3Force('charge')?.strength(-160)
    fg.d3Force('link')?.distance(70)
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

  // Push data updates. force-graph merges by node id and preserves existing
  // x/y/z, so re-supplying the full (re-styled) dataset does not reshuffle the layout.
  // Hover/chọn node chỉ đổi style, không đổi cấu trúc đồ thị: cập nhật tại chỗ để không
  // reheat simulation (nếu không, engine chạy lại rồi zoomToFit làm khung hình nhảy liên tục).
  const structKeyRef = useRef('')
  const fitOnStopRef = useRef(true)
  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
    const key =
      graphData.nodes.map((n) => asNode(n).id).join('|') +
      '#' +
      graphData.links.map((l) => `${asLink(l).source}>${asLink(l).target}`).join('|')
    if (key === structKeyRef.current) {
      const cur = fg.graphData()
      const skip = new Set(['x', 'y', 'vx', 'vy', 'fx', 'fy', 'index', 'source', 'target'])
      const merge = (to: object, from: object) => {
        for (const [k, v] of Object.entries(from)) if (!skip.has(k)) (to as Record<string, unknown>)[k] = v
      }
      graphData.nodes.forEach((n, i) => cur.nodes[i] && merge(cur.nodes[i], n))
      graphData.links.forEach((l, i) => cur.links[i] && merge(cur.links[i], l))
      fg.nodeColor(fg.nodeColor()) // buộc vẽ lại
      return
    }
    structKeyRef.current = key
    fitOnStopRef.current = true
    fg.graphData({ nodes: graphData.nodes, links: graphData.links })
  }, [graphData])

  // Tự căn khung hình ngay khi mở tab / khi tập nguồn đổi.
  useEffect(() => {
    const t = setTimeout(() => fgRef.current?.zoomToFit(500, 60), 600)
    return () => clearTimeout(t)
  }, [state.sources.length, state.sourceRelations.length])

  useEffect(() => {
    fgRef.current?.backgroundColor(BG_LIGHT)
  }, [])

  const zoomBy = (factor: number) => {
    const fg = fgRef.current
    if (!fg) return
    fg.zoom(fg.zoom() / factor, 300)
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
    <div className="graph-view" data-theme="light">
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
            className={`toolbar-btn${showAuthors ? ' active' : ''}`}
            onClick={() => setShowAuthors((v) => !v)}
          >
            Tác giả
          </button>
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
            <p className="graph-filter-label">Cụm chủ đề / loại nguồn</p>
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
              <span className="legend-swatch legend-swatch-gold" /> Relevance thấp (vàng)
            </div>
            <div className="graph-legend-row">
              <span className="legend-swatch legend-swatch-teal" /> Relevance cao (xanh dương)
            </div>
            <div className="graph-legend-row">
              <span className="legend-line legend-line-solid" /> Trích dẫn (cites)
            </div>
            <div className="graph-legend-row">
              <span className="legend-line legend-line-dashed" /> Cùng chủ đề (related)
            </div>
            <div className="graph-legend-row">
              <span className="legend-swatch" style={{ background: 'rgb(245,190,170)' }} /> Tác giả (từ 2 bài trở lên)
            </div>
            <div className="graph-legend-row">
              <span className="legend-swatch" style={{ background: '#00897B' }} /> Nguồn trung tâm
            </div>
            <p className="graph-legend-note">
              Kích thước node tỷ lệ theo số lượt trích dẫn. Kéo chuột để di chuyển, cuộn để zoom.
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
            <div className="graph-detail-head" style={{ paddingRight: 4 }}>
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

            {selectedSource.abstract && (
              <div className="graph-detail-section">
                <p className="graph-filter-label">Tóm tắt</p>
                <p className="graph-detail-abstract">{selectedSource.abstract}</p>
              </div>
            )}

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
              <button className="toolbar-btn link" onClick={() => openPaperModal(selectedSource.id)}>
                <ExternalLink size={14} /> Đọc ngay
              </button>
              {selectedSource.doi && (
                <a
                  className="toolbar-btn link"
                  href={`https://doi.org/${selectedSource.doi}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={14} /> Mở tài liệu gốc
                </a>
              )}
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
              <li>Kéo chuột: di chuyển sơ đồ 2D</li>
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
