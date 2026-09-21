import { useState, type KeyboardEvent } from 'react'
import { Paperclip, ArrowUp } from 'lucide-react'
import logo from '../../assets/logo.png'

const SUGGESTIONS = [
  'Ứng dụng RAG trong giáo dục',
  'AI trong phát hiện gian lận',
  'Ứng dụng LLM trong chăm sóc khách hàng',
  'Kiến trúc Microservices',
]

interface InitialStateProps {
  onSubmit: (topic: string) => void
}

export default function InitialState({ onSubmit }: InitialStateProps) {
  const [value, setValue] = useState('')

  const submit = () => {
    if (!value.trim()) return
    onSubmit(value)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="initial-state">
      <div className="initial-inner animate-fade-up">
        <div className="initial-logo">
          <img src={logo} alt="PaperAI logo" />
        </div>
        <h2>Bạn muốn nghiên cứu điều gì?</h2>
        <p>PaperAI sẽ giúp bạn tìm tài liệu, phân tích nguồn và xây dựng bài báo học thuật.</p>

        <div className="initial-input-card">
          <textarea
            rows={3}
            placeholder="Hãy mô tả chủ đề bạn muốn nghiên cứu..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <div className="initial-input-actions">
            <button className="icon-btn" type="button" aria-label="Đính kèm tệp">
              <Paperclip size={18} />
            </button>
            <button className="round-send-btn" onClick={submit} type="button" aria-label="Gửi">
              <ArrowUp size={18} />
            </button>
          </div>
        </div>

        <div className="suggestion-row">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="suggestion-chip" onClick={() => onSubmit(s)} type="button">
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
