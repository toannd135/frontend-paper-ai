import { Check, Loader2 } from 'lucide-react'

interface ProgressCardProps {
  steps: string[]
  activeIndex: number
  doneCount: number
  finished: boolean
}

export default function ProgressCard({ steps, activeIndex, doneCount, finished }: ProgressCardProps) {
  return (
    <div className="chat-row ai animate-fade-up">
      <div className="chat-avatar-spacer" />
      <div className="progress-card">
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
