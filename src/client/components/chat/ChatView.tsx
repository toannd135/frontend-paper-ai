import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Paperclip, ArrowUp, FileText, Loader2, Check, X, BookOpenText } from 'lucide-react'
import { useApp } from '../../state/AppContext'
import { useChatModels } from '../../state/useChatModels'
import UserBubble from './UserBubble'
import { AiText, AiTyping } from './AiBubble'
import ClarifyCard from './ClarifyCard'
import SpecificationCard from './SpecificationCard'
import ProgressCard from './ProgressCard'

export default function ChatView() {
  const {
    state,
    chatMessages,
    clarificationAnswerList,
    answerClarify,
    beginResearchFromSpec,
    beginArticleFromButton,
    sendChatMessage,
    uploadPaperFile,
  } = useApp()
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState('')
  const { models, selectedModel, setSelectedModel } = useChatModels()

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [chatMessages])

  const send = () => {
    if (!input.trim()) return
    sendChatMessage(input, selectedModel)
    setInput('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const onAttachClick = () => fileInputRef.current?.click()
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadPaperFile(file)
    e.target.value = ''
  }

  const specStarted = state.stage !== 'specification'
  const placeholder =
    state.paperId && state.stage === 'chat'
      ? 'Hỏi về nội dung tài liệu đã tải lên...'
      : state.paperId
        ? 'Hỏi về tài liệu đã tải lên hoặc chủ đề nghiên cứu...'
        : 'Hỏi PaperAI về kho tài liệu đã lập chỉ mục...'

  return (
    <div className="chat-view">
      <div className="chat-messages scrollbar-thin" ref={scrollRef}>
        {chatMessages.map((m) => {
          switch (m.kind) {
            case 'user':
              return <UserBubble key={m.id} text={m.text} />
            case 'ai-typing':
              return <AiTyping key={m.id} />
            case 'ai-text':
              return <AiText key={m.id} text={m.text} citations={m.citations} tone={m.tone} />
            case 'clarify':
              return (
                <ClarifyCard
                  key={m.id}
                  prompt={m.prompt}
                  suggestions={m.suggestions}
                  answered={m.answered}
                  value={m.value}
                  onSubmit={(value) => answerClarify(m.id, value)}
                />
              )
            case 'specification':
              return (
                <SpecificationCard
                  key={m.id}
                  topic={state.topic}
                  answers={clarificationAnswerList}
                  started={specStarted}
                  onBegin={() => beginResearchFromSpec()}
                />
              )
            case 'progress':
              return (
                <ProgressCard
                  key={m.id}
                  steps={m.steps}
                  activeIndex={m.activeIndex}
                  doneCount={m.doneCount}
                  finished={m.finished}
                />
              )
            case 'paper-upload':
              return (
                <div className="chat-row ai animate-fade-up" key={m.id}>
                  <div className="chat-avatar-spacer" />
                  <div className={`bubble ai paper-upload-bubble${m.status === 'failed' ? ' failed' : ''}`}>
                    <FileText size={14} />
                    <span className="paper-upload-name">{m.filename}</span>
                    <span className="paper-upload-status">
                      {m.status === 'pending' && 'đang tải lên'}
                      {m.status === 'processing' && 'đang lập chỉ mục'}
                      {m.status === 'done' && 'sẵn sàng'}
                      {m.status === 'failed' && (m.error ?? 'thất bại')}
                    </span>
                    {(m.status === 'pending' || m.status === 'processing') && <Loader2 size={14} className="spin" />}
                    {m.status === 'done' && <Check size={14} color="var(--color-primary)" />}
                    {m.status === 'failed' && <X size={14} color="#c0392b" />}
                  </div>
                </div>
              )
            case 'generate-button':
              return (
                <div className="generate-btn-row animate-fade-up" key={m.id}>
                  <div className="chat-avatar-spacer" />
                  <button
                    onClick={() => beginArticleFromButton(m.id)}
                    disabled={m.clicked}
                    className={`generate-article-btn${m.clicked ? ' clicked' : ''}`}
                  >
                    <BookOpenText size={16} />
                    <span>{m.clicked ? 'Đã mở bài báo' : 'Xem bài báo'}</span>
                  </button>
                </div>
              )
            default:
              return null
          }
        })}
      </div>

      <div className="chat-input-bar">
        <div className="chat-input-card">
          <textarea
            rows={1}
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />
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
          <button className="icon-btn" type="button" aria-label="Đính kèm tệp PDF" onClick={onAttachClick}>
            <Paperclip size={16} />
          </button>
          <button className="round-send-btn" style={{ width: 32, height: 32 }} onClick={send} type="button" aria-label="Gửi" disabled={!input.trim()}>
            <ArrowUp size={16} />
          </button>
        </div>
        <p className="chat-input-hint">PaperAI có thể tạo nội dung chưa chính xác — hãy luôn kiểm tra lại nguồn.</p>
      </div>
    </div>
  )
}
