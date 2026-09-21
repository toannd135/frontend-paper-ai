import { ClipboardList, Search } from 'lucide-react'

interface SpecificationCardProps {
  topic: string
  focus?: string
  years?: string
  length?: string
  onBegin: () => void
  started: boolean
}

export default function SpecificationCard({ topic, focus, years, length, onBegin, started }: SpecificationCardProps) {
  return (
    <div className="chat-row ai animate-fade-up">
      <div className="chat-avatar-spacer" />
      <div className="spec-card">
        <div className="spec-card-header">
          <ClipboardList size={16} color="var(--color-primary)" />
          <span>Research Specification</span>
        </div>
        <div className="spec-card-body">
          <div>
            <p className="spec-label">Topic</p>
            <p className="spec-value" style={{ fontWeight: 500 }}>
              {topic}
            </p>
          </div>
          <div>
            <p className="spec-label">Focus</p>
            <p className="spec-value">{focus}</p>
          </div>
          <div>
            <p className="spec-label">Publication years</p>
            <p className="spec-value">{years === 'Tất cả' ? '2022 – 2026' : years}</p>
          </div>
          <div>
            <p className="spec-label">Article length</p>
            <p className="spec-value">{length}</p>
          </div>
          <div>
            <p className="spec-label">Sources</p>
            <p className="spec-value">Academic papers</p>
          </div>
        </div>
        <div className="spec-card-footer">
          <button
            onClick={onBegin}
            disabled={started}
            className="sidebar-footer-btn"
            style={{
              background: started ? 'rgba(217,164,65,0.6)' : 'var(--color-gold)',
              color: '#fff',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '13.5px',
              padding: '10px',
              width: '100%',
              cursor: started ? 'default' : 'pointer',
            }}
          >
            <Search size={16} />
            <span>{started ? 'Đã bắt đầu' : 'Bắt đầu nghiên cứu'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
