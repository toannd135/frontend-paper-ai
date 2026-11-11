import { useEffect, useRef } from 'react'
import { Check, Loader2 } from 'lucide-react'
import type { ProgressLogEntry } from '../../../types'

interface ProgressCardProps {
  steps: string[]
  activeIndex: number
  doneCount: number
  finished: boolean
  log?: ProgressLogEntry[]
  waiting?: boolean
}

const clock = (t: number) => new Date(t * 1000).toLocaleTimeString('vi-VN', { hour12: false })

export default function ProgressCard({ steps, activeIndex, doneCount, finished, log = [], waiting }: ProgressCardProps) {
  const logRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // Luôn cuộn xuống dòng log mới nhất.
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log.length])
  const total = Math.max(steps.length, 1)
  const started = activeIndex >= 0
  const percent = finished ? 100 : started ? Math.min(99, Math.round(((doneCount + 0.5) / total) * 100)) : 0
  return (
    <div className="chat-row ai animate-fade-up">
      <div className="chat-avatar-spacer" />
      <div className="progress-card">
        <div className="progress-percent-row">
          <span>{finished ? 'Hoàn tất' : waiting ? 'Đang chờ worker nhận việc…' : 'Đang xử lý'}</span>
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
        <div className="progress-log" ref={logRef} aria-live="polite">
          {log.length === 0 ? (
            <div className="progress-log-line muted">
              {waiting
                ? 'Task đang nằm trong hàng đợi. Nếu đứng mãi ở đây, có thể worker (Celery) chưa được bật.'
                : 'Chưa có nhật ký.'}
            </div>
          ) : (
            log.map((e, i) => (
              <div className="progress-log-line" key={`${e.time}-${i}`}>
                <span className="progress-log-time">{clock(e.time)}</span>
                {e.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
