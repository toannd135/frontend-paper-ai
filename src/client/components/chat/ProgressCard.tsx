import { Check, Loader2 } from 'lucide-react'

interface ProgressCardProps {
  steps: string[]
  activeIndex: number
  doneCount: number
  finished: boolean
}

export default function ProgressCard({ steps, activeIndex, doneCount, finished }: ProgressCardProps) {
  const total = Math.max(steps.length, 1)
  const percent = finished ? 100 : Math.min(99, Math.round(((doneCount + 0.5) / total) * 100))
  return (
    <div className="chat-row ai animate-fade-up">
      <div className="chat-avatar-spacer" />
      <div className="progress-card">
        <div className="progress-percent-row">
          <span>{finished ? 'Hoàn tất' : 'Đang xử lý'}</span>
          <strong>{percent}%</strong>
        </div>
        <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="progress-line" />
        <div className="progress-steps">
          {steps.map((label, i) => {
            const done = finished || i < doneCount
            const active = !finished && i === activeIndex && !done
            return (
              <div className="progress-step" key={label}>
                <div className={`step-icon ${done ? 'done' : active ? 'active' : 'pending'}`}>
                  {done && <Check size={12} color="#fff" />}
                  {active && <Loader2 size={12} color="#fff" className="spin" />}
                </div>
                <span className={`step-label${done || active ? ' current' : ''}`}>{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
