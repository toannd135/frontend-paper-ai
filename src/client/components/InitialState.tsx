import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { Paperclip, ArrowUp } from 'lucide-react'
import logo from '../../assets/logo.png'
import { topicSuggestions } from '../constants'
import { useChatModels } from '../state/useChatModels'

interface InitialStateProps {
  onSubmit: (topic: string) => void
  onUploadPaper: (file: File) => void
}

export default function InitialState({ onSubmit, onUploadPaper }: InitialStateProps) {
  const [value, setValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { models, selectedModel, setSelectedModel } = useChatModels()

  const [placeholder, setPlaceholder] = useState('')
  useEffect(() => {
    const phrases = topicSuggestions
    let p = 0, c = 0, del = false
    let t: ReturnType<typeof setTimeout>
    const tick = () => {
      const full = phrases[p]
      c += del ? -1 : 1
      setPlaceholder(full.slice(0, c))
      let wait = del ? 25 : 60
      if (!del && c === full.length) { del = true; wait = 1400 }
      else if (del && c === 0) { del = false; p = (p + 1) % phrases.length; wait = 400 }
      t = setTimeout(tick, wait)
    }
    t = setTimeout(tick, 400)
    return () => clearTimeout(t)
  }, [])

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

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUploadPaper(file)
    e.target.value = ''
  }

  return (
    <div className="initial-state">
      <div className="initial-inner animate-fade-up">
        <div className="initial-logo">
          <img src={logo} alt="PaperAI logo" />
        </div>
        <h2>Bạn muốn nghiên cứu điều gì?</h2>
        <p>PaperAI sẽ tìm tài liệu, phân tích nguồn và tổng hợp thành bài báo học thuật có trích dẫn.</p>

        <div className="initial-input-card">
          <textarea
            rows={3}
            placeholder={placeholder ? `${placeholder}|` : 'Hãy mô tả chủ đề bạn muốn nghiên cứu...'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Chủ đề nghiên cứu"
          />
          <div className="initial-input-actions">
            {models.length > 0 && (
              <select
                className="chat-model-select in-card"
                value={selectedModel ?? ''}
                onChange={(e) => setSelectedModel(e.target.value)}
                aria-label="Chọn model trả lời"
                title={models.find((m) => m.id === selectedModel)?.label}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} disabled={!m.available}>
                    {m.label}
                    {!m.available ? ' (cần API key)' : ''}
                  </option>
                ))}
              </select>
            )}
            <span className="initial-actions-spacer" />
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />
            <button
              className="icon-btn"
              type="button"
              aria-label="Tải PDF lên để hỏi đáp trực tiếp"
              title="Tải PDF lên để hỏi đáp trực tiếp với tài liệu"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={18} />
            </button>
            <button className="round-send-btn" onClick={submit} type="button" aria-label="Gửi" disabled={!value.trim()}>
              <ArrowUp size={18} />
            </button>
          </div>
        </div>

        <div className="suggestion-row">
          {topicSuggestions.map((s) => (
            <button key={s} className="suggestion-chip" onClick={() => onSubmit(s)} type="button">
              {s}
            </button>
          ))}
        </div>
        <p className="initial-hint">
          Hoặc bấm <Paperclip size={12} style={{ verticalAlign: -2 }} /> để tải một PDF lên và hỏi đáp trực tiếp với nội dung tài liệu.
        </p>
      </div>
    </div>
  )
}
