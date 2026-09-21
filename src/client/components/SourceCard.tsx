import { Check, Quote } from 'lucide-react'
import type { ResearchSource } from '../../types'

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

interface SourceCardProps {
  paper: ResearchSource
  selected: boolean
  flash: boolean
  onView: () => void
  onToggleSelect: () => void
}

function StatusBadge({ paper, selected }: { paper: ResearchSource; selected: boolean }) {
  if (selected) {
    return (
      <span className="source-badge selected">
        <Check size={10} /> Selected
      </span>
    )
  }
  if (paper.relevance >= 85) {
    return <span className="source-badge high">High relevance</span>
  }
  return <span className="source-badge found">Found</span>
}

export default function SourceCard({ paper, selected, flash, onView, onToggleSelect }: SourceCardProps) {
  return (
    <div
      id={`source-${paper.id}`}
      className={`source-card${selected ? ' selected' : ''}${flash ? ' flash-highlight' : ''}`}
      onClick={onView}
    >
      <div className="source-card-top">
        <p className="source-card-title">{truncate(paper.title, 62)}</p>
        <StatusBadge paper={paper} selected={selected} />
      </div>
      <p className="source-card-authors">{paper.authors}</p>
      <div className="source-card-meta">
        <span>{paper.year}</span>
        <span>·</span>
        <span>{paper.publisher}</span>
        <span>·</span>
        <span>{paper.type}</span>
      </div>
      <div className="source-card-relevance">
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div className="relevance-track">
            <div className="relevance-fill" style={{ width: `${paper.relevance}%` }} />
          </div>
          <span className="relevance-pct">{paper.relevance}%</span>
        </div>
        {paper.citations ? (
          <span className="source-card-citations">
            <Quote size={12} />
            {paper.citations}
          </span>
        ) : null}
      </div>
      <div className="source-card-actions" onClick={(e) => e.stopPropagation()}>
        <button className="btn-view" onClick={onView}>
          View
        </button>
        <button className={selected ? 'btn-remove' : 'btn-use'} onClick={onToggleSelect}>
          {selected ? 'Remove' : 'Use'}
        </button>
      </div>
    </div>
  )
}
