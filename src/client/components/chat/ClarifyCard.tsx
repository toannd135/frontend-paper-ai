import { useState, type KeyboardEvent } from 'react'
import { ArrowUp } from 'lucide-react'
import { AiAvatar } from './AiBubble'

interface ClarifyCardProps {
  prompt: string
  suggestions: string[]
  answered: boolean
  value: string
  onSubmit: (value: string) => void
}

export default function ClarifyCard({ prompt, suggestions, answered, value, onSubmit }: ClarifyCardProps) {
  const [draft, setDraft] = useState('')
  const [showFreeText, setShowFreeText] = useState(suggestions.length === 0)

  const submit = (text: string) => {
    if (!text.trim()) return
    onSubmit(text.trim())
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit(draft)
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
          <>
            {suggestions.length > 0 && (
              <div className="option-group" style={{ maxWidth: 420, marginBottom: showFreeText ? 8 : 0 }}>
                {suggestions.map((s) => (
                  <button key={s} type="button" className="option-btn" onClick={() => submit(s)}>
                    <span>{s}</span>
                  </button>
                ))}
                {!showFreeText && (
                  <button type="button" className="option-btn" onClick={() => setShowFreeText(true)}>
                    <span>Khác...</span>
                  </button>
                )}
              </div>
            )}
            {showFreeText && (
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
                <button
                  className="round-send-btn"
                  style={{ width: 32, height: 32 }}
                  onClick={() => submit(draft)}
                  type="button"
                >
                  <ArrowUp size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
