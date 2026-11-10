import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { Paperclip, ArrowUp, FileUp, X } from 'lucide-react'
import logo from '../../assets/logo.png'
import { audienceOptions, fieldOptions, topicSuggestions, venueOptions } from '../constants'
import type { ResearchAudience, ResearchField, ResearchOptions, ResearchVenue } from '../../types'
import { useChatModels } from '../state/useChatModels'

interface InitialStateProps {
  onSubmit: (topic: string, options: ResearchOptions, files?: File[]) => void
  onUploadPaper: (file: File) => void
}

const MAX_PAPERS = 10
const MAX_PAPER_MB = 50 // khớp `max_upload_mb` của backend
const paperKey = (f: File) => `${f.name}:${f.size}`

export default function InitialState({ onSubmit, onUploadPaper }: InitialStateProps) {
  const [value, setValue] = useState('')
  const [audience, setAudience] = useState<ResearchAudience>('lecturer')
  const [field, setField] = useState<ResearchField>('')
  const [venue, setVenue] = useState<ResearchVenue>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const papersInputRef = useRef<HTMLInputElement>(null)
  const [useOwnPapers, setUseOwnPapers] = useState(false)
  const [papers, setPapers] = useState<File[]>([])
  const [papersError, setPapersError] = useState('')
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

  const missingPapers = useOwnPapers && papers.length === 0
  const selectedPapers = useOwnPapers ? papers : []

  const submit = () => {
    if (!value.trim() || missingPapers) return
    onSubmit(value, { audience, field, venue }, selectedPapers)
  }

  const onPapersChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ''
    const valid = picked.filter((f) => f.name.toLowerCase().endsWith('.pdf') && f.size <= MAX_PAPER_MB * 1024 * 1024)
    const existing = new Set(papers.map(paperKey))
    const merged = [...papers, ...valid.filter((f) => !existing.has(paperKey(f)))]
    setPapers(merged.slice(0, MAX_PAPERS))
    if (valid.length < picked.length) setPapersError(`Đã bỏ qua file không phải PDF hoặc lớn hơn ${MAX_PAPER_MB} MB.`)
    else if (merged.length > MAX_PAPERS) setPapersError(`Chỉ dùng tối đa ${MAX_PAPERS} PDF mỗi lần.`)
    else setPapersError('')
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
          <div className="paper-source-row" role="radiogroup" aria-label="Nguồn tài liệu">
            <button
              type="button"
              role="radio"
              aria-checked={!useOwnPapers}
              className={`paper-source-option${!useOwnPapers ? ' active' : ''}`}
              onClick={() => setUseOwnPapers(false)}
            >
              Tự tìm trên OpenAlex
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={useOwnPapers}
              className={`paper-source-option${useOwnPapers ? ' active' : ''}`}
              onClick={() => setUseOwnPapers(true)}
            >
              Dùng bài báo của tôi
            </button>
          </div>
          {useOwnPapers && (
            <div className="paper-picker">
              <input
                ref={papersInputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                style={{ display: 'none' }}
                onChange={onPapersChange}
                data-testid="research-papers-input"
              />
              <button type="button" className="paper-picker-add" onClick={() => papersInputRef.current?.click()}>
                <FileUp size={15} /> Chọn PDF
              </button>
              <span className="paper-picker-note">Tối đa {MAX_PAPERS} PDF. Bài báo chỉ dựa trên các file này.</span>
              {papers.length > 0 && (
                <ul className="paper-picker-list">
                  {papers.map((f) => (
                    <li key={paperKey(f)}>
                      <span title={f.name}>{f.name}</span>
                      <button
                        type="button"
                        aria-label={`Bỏ ${f.name}`}
                        onClick={() => setPapers((current) => current.filter((p) => paperKey(p) !== paperKey(f)))}
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {papersError && <p className="paper-picker-error">{papersError}</p>}
            </div>
          )}
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
            <select
              className="chat-model-select in-card"
              value={audience}
              onChange={(e) => setAudience(e.target.value as ResearchAudience)}
              aria-label="Đối tượng đọc"
              title={`Đối tượng đọc: ${audienceOptions.find((o) => o.value === audience)?.label ?? ''}`}
            >
              {audienceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className="chat-model-select in-card"
              value={field}
              onChange={(e) => setField(e.target.value as ResearchField)}
              aria-label="Lĩnh vực"
              title={`Lĩnh vực: ${fieldOptions.find((o) => o.value === field)?.label ?? ''}`}
            >
              {fieldOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className="chat-model-select in-card"
              value={venue}
              onChange={(e) => setVenue(e.target.value as ResearchVenue)}
              aria-label="Nơi nộp bài"
              title={`Nơi nộp bài: ${venueOptions.find((o) => o.value === venue)?.label ?? ''}`}
            >
              {venueOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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
            <button className="round-send-btn" onClick={submit} type="button" aria-label="Gửi" disabled={!value.trim() || missingPapers}>
              <ArrowUp size={18} />
            </button>
          </div>
        </div>

        <div className="suggestion-row">
          {topicSuggestions.map((s) => (
            <button
              key={s}
              className="suggestion-chip"
              onClick={() => onSubmit(s, { audience, field, venue }, selectedPapers)}
              type="button"
              disabled={missingPapers}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="initial-hint">
          Hoặc bấm <Paperclip size={12} style={{ verticalAlign: -2 }} /> để hỏi đáp trực tiếp với một PDF mà không tạo bài báo.
        </p>
      </div>
    </div>
  )
}
