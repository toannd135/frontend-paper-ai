import logo from '../../../assets/logo.png'
import type { Citation } from '../../../types'
import { renderCitedText } from '../../lib/reportText'

export function AiAvatar() {
  return (
    <div className="chat-avatar">
      <img src={logo} alt="PaperAI" />
    </div>
  )
}

export function AiTyping() {
  return (
    <div className="chat-row ai animate-fade-up">
      <AiAvatar />
      <div className="bubble ai typing">
        <div className="dot-flash">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}

export function AiText({
  text,
  citations,
  tone,
}: {
  text: string
  citations?: Citation[]
  tone?: 'info' | 'error' | 'success'
}) {
  return (
    <div className="chat-row ai animate-fade-up">
      <AiAvatar />
      <div className={`bubble ai${tone ? ` tone-${tone}` : ''}`}>
        {citations && citations.length > 0 ? renderCitedText(text, citations) : text}
      </div>
    </div>
  )
}
