import { useState, type KeyboardEvent } from 'react'
import { ArrowUp } from 'lucide-react'
import { AiAvatar } from './AiBubble'

interface ClarifyCardProps {
  prompt: string
  answered: boolean
  value: string
  onSubmit: (value: string) => void
}

export default function ClarifyCard({ prompt, answered, value, onSubmit }: ClarifyCardProps) {
  const [draft, setDraft] = useState('')

  const submit = () => {
    if (!draft.trim()) return
    onSubmit(draft.trim())
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="chat-row ai animate-fade-up">
      <AiAvatar />
      <div style={{ maxWidth: '70%' }}>
        <div className="bubble ai" style={{ marginBottom: 10, display: 'inline-block' }}>
          {prompt}
        </div>
        {answered ? (
          <div className="option-btn selected" style={{ display: 'inline-flex' }}>
            <span>{value}</span>
          </div>
        ) : (
          <div className="chat-input-card" style={{ maxWidth: 420 }}>
            <input
              type="text"
              placeholder="Nhập câu trả lời..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              style={{
                flex: 1,
                border: 0,
                outline: 'none',
                background: 'transparent',
                fontSize: 13.5,
                padding: '6px 4px',
              }}
            />
            <button className="round-send-btn" style={{ width: 32, height: 32 }} onClick={submit} type="button">
              <ArrowUp size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
