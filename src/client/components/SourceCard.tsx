import { Quote } from 'lucide-react'
import type { ResearchSource } from '../../types'

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

interface SourceCardProps {
  paper: ResearchSource
  flash: boolean
  onView: () => void
}

function StatusBadge({ paper }: { paper: ResearchSource }) {
  if (paper.relevance >= 85) {
    return <span className="source-badge high">High relevance</span>
  }
  return <span className="source-badge found">Found</span>
}

export default function SourceCard({ paper, flash, onView }: SourceCardProps) {
  return (
    <div
      id={`source-${paper.id}`}
      className={`source-card${flash ? ' flash-highlight' : ''}`}
      onClick={onView}
    >
      <div className="source-card-top">
        <p className="source-card-title">{truncate(paper.title, 62)}</p>
        <StatusBadge paper={paper} />
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
      </div>
    </div>
  )
}
