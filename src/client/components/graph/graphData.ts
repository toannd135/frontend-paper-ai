import type { ResearchSource, SourceRelation } from '../../../types'

export type GraphTheme = 'light' | 'dark'

export interface Graph3DNode {
  id: string
  source: ResearchSource
  __color: string
  __val: number
  __tier: 'center' | 'mid' | 'small' | 'author'
  __kind: 'paper' | 'author'
  x?: number
  y?: number
  z?: number
}

export interface Graph3DLink {
  id: string
  source: string
  target: string
  kind: SourceRelation['kind'] | 'author'
  __color: string
  __width: number
  __particles: number
  __label: string
}

// Relevance scale endpoints are deliberately more saturated than the app's pale
// --color-gold-light token — that pastel tone barely contrasts against the cream
// canvas background and was the main reason nodes were hard to see.
const RELEVANCE_LOW: [number, number, number] = [250, 220, 140] // pastel vàng
const RELEVANCE_HIGH: [number, number, number] = [150, 205, 235] // pastel xanh dương
const RELEVANCE_MID: [number, number, number] = [170, 220, 175] // pastel xanh lá
const CENTER: [number, number, number] = [0, 137, 123] // #00897B — node trung tâm
const GOLD: [number, number, number] = [217, 164, 65] // --color-gold — reserved for the selected node only
const TEAL_LIGHT: [number, number, number] = [14, 159, 145] // --color-primary-light — neighbor highlight

const BG_LIGHT: [number, number, number] = [255, 248, 232] // --color-cream-surface
const BG_DARK: [number, number, number] = [18, 33, 31] // matches .graph-view[data-theme='dark']

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function mixRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))]
}

function toHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`
}

function relevanceColor(relevance: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, (relevance - 60) / (95 - 60)))
  return t < 0.5 ? mixRgb(RELEVANCE_LOW, RELEVANCE_MID, t * 2) : mixRgb(RELEVANCE_MID, RELEVANCE_HIGH, (t - 0.5) * 2)
}

export function nodeValue(citations: number) {
  return Math.max(3, Math.min(22, 3 + Math.log2(citations + 1) * 1.8))
}

export function truncateLabel(text: string, max: number) {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

export interface BuildGraph3DParams {
  sources: ResearchSource[]
  relations: SourceRelation[]
  theme: GraphTheme
  selectedId: string | null
  excludedIds: Set<string>
  hoverId?: string | null
  showAuthors?: boolean
}

const AUTHOR_PREFIX = 'author:'
const AUTHOR_RGB: [number, number, number] = [245, 190, 170] // pastel cam
const RELATION_LABEL: Record<string, string> = { author: 'Tác giả', cites: 'Trích dẫn', related: 'Cùng chủ đề' }

export function buildGraph3DElements({
  sources,
  relations,
  theme,
  selectedId,
  excludedIds,
  hoverId = null,
  showAuthors = false,
}: BuildGraph3DParams): { nodes: Graph3DNode[]; links: Graph3DLink[] } {
  const idSet = new Set(sources.map((s) => s.id))
  const visibleRelations = relations.filter((r) => idSet.has(r.source) && idSet.has(r.target))

  // Hover ưu tiên hơn selected để tập trung luồng thông tin khi di chuột.
  const focusId = hoverId ?? selectedId
  const neighborIds = new Set<string>()
  if (focusId) {
    visibleRelations.forEach((r) => {
      if (r.source === focusId) neighborIds.add(r.target)
      if (r.target === focusId) neighborIds.add(r.source)
    })
  }

  const centerId = sources.length
    ? sources.reduce((best, s) => (s.relevance > best.relevance ? s : best), sources[0]).id
    : null

  const bg = theme === 'dark' ? BG_DARK : BG_LIGHT

  const nodes: Graph3DNode[] = sources.map((s) => {
    const isSelected = s.id === focusId
    const isNeighbor = neighborIds.has(s.id)
    const isExcluded = excludedIds.has(s.id)
    const dimmed = (focusId !== null && !isSelected && !isNeighbor) || isExcluded

    const tier: Graph3DNode['__tier'] = s.id === centerId ? 'center' : s.relevance >= 80 ? 'mid' : 'small'
    const tierScale = tier === 'center' ? 1.9 : tier === 'mid' ? 1.1 : 0.75

    let rgb = tier === 'center' ? CENTER : relevanceColor(s.relevance)
    if (isSelected && tier !== 'center') rgb = GOLD
    else if (isNeighbor && tier !== 'center') rgb = TEAL_LIGHT
    if (dimmed) rgb = mixRgb(rgb, bg, isExcluded ? 0.72 : 0.45)

    return {
      id: s.id,
      source: s,
      __color: toHex(rgb),
      __val: (isSelected ? nodeValue(s.citations) * 1.35 : nodeValue(s.citations)) * tierScale,
      __tier: tier,
      __kind: 'paper',
    }
  })

  const links: Graph3DLink[] = visibleRelations.map((r) => {
    const touchesSelected = focusId !== null && (r.source === focusId || r.target === focusId)
    const touchesExcluded = excludedIds.has(r.source) || excludedIds.has(r.target)
    const isCites = r.kind === 'cites'

    let rgb: [number, number, number] = theme === 'dark' ? [214, 197, 168] : [90, 82, 60]
    let width = isCites ? 1.4 : 0.7
    let particles = 0

    if (touchesSelected) {
      rgb = GOLD
      width = isCites ? 2.6 : 1.6
      particles = isCites ? 3 : 0
    } else if (focusId !== null || touchesExcluded) {
      rgb = mixRgb(rgb, bg, 0.75)
      width = 0.4
    }

    return {
      id: `${r.source}->${r.target}`,
      source: r.source,
      target: r.target,
      kind: r.kind,
      __color: toHex(rgb),
      __width: width,
      __particles: particles,
      __label: touchesSelected ? (RELATION_LABEL[r.kind] ?? r.kind) : '',
    }
  })

  if (showAuthors) {
    const byAuthor = new Map<string, string[]>()
    sources.forEach((s) => {
      s.authors
        .replace(/et al\.?/gi, '')
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a && a !== 'Không rõ tác giả')
        .forEach((a) => byAuthor.set(a, [...(byAuthor.get(a) ?? []), s.id]))
    })
    byAuthor.forEach((paperIds, name) => {
      if (paperIds.length < 2) return
      const id = AUTHOR_PREFIX + name
      const dimmed = (focusId !== null && !paperIds.includes(focusId) && focusId !== id) || paperIds.every((p) => excludedIds.has(p))
      nodes.push({
        id,
        source: { id, title: name, authors: name, year: 0, publisher: '', type: 'Tác giả', doi: '', relevance: 0, citations: 0, abstract: null, status: 'found' },
        __color: toHex(dimmed ? mixRgb(AUTHOR_RGB, bg, 0.6) : AUTHOR_RGB),
        __val: 2.2,
        __tier: 'author',
        __kind: 'author',
      })
      paperIds.forEach((pid) => {
        const touches = focusId !== null && (focusId === id || focusId === pid)
        links.push({
          id: `${id}->${pid}`,
          source: id,
          target: pid,
          kind: 'author',
          __color: toHex(touches ? AUTHOR_RGB : mixRgb(AUTHOR_RGB, bg, focusId !== null ? 0.8 : 0.5)),
          __width: touches ? 1.4 : 0.5,
          __particles: 0,
          __label: touches ? 'Tác giả' : '',
        })
      })
    })
  }

  return { nodes, links }
}
