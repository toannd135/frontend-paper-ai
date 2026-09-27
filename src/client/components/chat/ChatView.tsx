import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Paperclip, ArrowUp, Sparkles, FileText, Loader2, Check, X } from 'lucide-react'
import { useApp } from '../../state/AppContext'
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

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [chatMessages])

  const send = () => {
    if (!input.trim()) return
    sendChatMessage(input)
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
              return <AiText key={m.id} text={m.text} citations={m.citations} />
            case 'clarify':
              return (
                <ClarifyCard
                  key={m.id}
                  prompt={m.prompt}
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
                  <div className="bubble ai" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={14} />
                    <span>{m.filename}</span>
                    {(m.status === 'pending' || m.status === 'processing') && (
                      <Loader2 size={14} className="spin" />
                    )}
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
                    className="sidebar-footer-btn"
                    style={{
                      background: m.clicked ? 'rgba(217,164,65,0.6)' : 'var(--color-gold)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      padding: '10px 20px',
                      width: 'auto',
                      borderRadius: 10,
                      boxShadow: 'var(--shadow-soft)',
                      cursor: m.clicked ? 'default' : 'pointer',
                    }}
                  >
                    <Sparkles size={16} />
                    <span>Tạo bài báo</span>
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
            placeholder="Nhắn tin cho PaperAI..."
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
          <button className="icon-btn" type="button" aria-label="Đính kèm tệp PDF" onClick={onAttachClick}>
            <Paperclip size={16} />
          </button>
          <button className="round-send-btn" style={{ width: 32, height: 32 }} onClick={send} type="button">
            <ArrowUp size={16} />
          </button>
        </div>
        <p className="chat-input-hint">PaperAI có thể tạo nội dung chưa chính xác — hãy luôn kiểm tra lại nguồn.</p>
      </div>
    </div>
  )
}
