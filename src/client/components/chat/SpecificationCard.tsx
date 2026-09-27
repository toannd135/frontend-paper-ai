import { ClipboardList, Search } from 'lucide-react'
import type { ClarificationAnswer } from '../../../types'

interface SpecificationCardProps {
  topic: string
  answers: ClarificationAnswer[]
  onBegin: () => void
  started: boolean
}

export default function SpecificationCard({ topic, answers, onBegin, started }: SpecificationCardProps) {
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
          {answers.length === 0 ? (
            <div>
              <p className="spec-label">Ghi chú</p>
              <p className="spec-value">Không cần làm rõ thêm — hệ thống đã đủ thông tin để nghiên cứu.</p>
            </div>
          ) : (
            answers.map((a) => (
              <div key={a.question}>
                <p className="spec-label">{a.question}</p>
                <p className="spec-value">{a.answer}</p>
              </div>
            ))
          )}
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
