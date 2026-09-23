import type { ResearchSource, SourceRelation } from '../../../types'

export type GraphTheme = 'light' | 'dark'

export interface Graph3DNode {
  id: string
  source: ResearchSource
  __color: string
  __val: number
  x?: number
  y?: number
  z?: number
}

export interface Graph3DLink {
  id: string
  source: string
  target: string
  kind: SourceRelation['kind']
  __color: string
  __width: number
  __particles: number
}

// Relevance scale endpoints are deliberately more saturated than the app's pale
// --color-gold-light token — that pastel tone barely contrasts against the cream
// canvas background and was the main reason nodes were hard to see.
const RELEVANCE_LOW: [number, number, number] = [205, 133, 63] // saturated amber/rust
const RELEVANCE_HIGH: [number, number, number] = [6, 95, 87] // deeper teal than --color-primary, reads better as a filled sphere
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
  return mixRgb(RELEVANCE_LOW, RELEVANCE_HIGH, t)
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
}

export function buildGraph3DElements({
  sources,
  relations,
  theme,
  selectedId,
  excludedIds,
}: BuildGraph3DParams): { nodes: Graph3DNode[]; links: Graph3DLink[] } {
  const idSet = new Set(sources.map((s) => s.id))
  const visibleRelations = relations.filter((r) => idSet.has(r.source) && idSet.has(r.target))

  const neighborIds = new Set<string>()
  if (selectedId) {
    visibleRelations.forEach((r) => {
      if (r.source === selectedId) neighborIds.add(r.target)
      if (r.target === selectedId) neighborIds.add(r.source)
    })
  }

  const bg = theme === 'dark' ? BG_DARK : BG_LIGHT

  const nodes: Graph3DNode[] = sources.map((s) => {
    const isSelected = s.id === selectedId
    const isNeighbor = neighborIds.has(s.id)
    const isExcluded = excludedIds.has(s.id)
    const dimmed = (selectedId !== null && !isSelected && !isNeighbor) || isExcluded

    let rgb = relevanceColor(s.relevance)
    if (isSelected) rgb = GOLD
    else if (isNeighbor) rgb = TEAL_LIGHT
    if (dimmed) rgb = mixRgb(rgb, bg, isExcluded ? 0.72 : 0.45)

    return {
      id: s.id,
      source: s,
      __color: toHex(rgb),
      __val: isSelected ? nodeValue(s.citations) * 1.35 : nodeValue(s.citations),
    }
  })

  const links: Graph3DLink[] = visibleRelations.map((r) => {
    const touchesSelected = selectedId !== null && (r.source === selectedId || r.target === selectedId)
    const touchesExcluded = excludedIds.has(r.source) || excludedIds.has(r.target)
    const isCites = r.kind === 'cites'

    let rgb: [number, number, number] = theme === 'dark' ? [214, 197, 168] : [90, 82, 60]
    let width = isCites ? 1.4 : 0.7
    let particles = 0

    if (touchesSelected) {
      rgb = GOLD
      width = isCites ? 2.6 : 1.6
      particles = isCites ? 3 : 0
    } else if (selectedId !== null || touchesExcluded) {
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
    }
  })

  return { nodes, links }
}
