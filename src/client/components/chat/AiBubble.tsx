import logo from '../../../assets/logo.png'

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

export function AiText({ text }: { text: string }) {
  return (
    <div className="chat-row ai animate-fade-up">
      <AiAvatar />
      <div className="bubble ai">{text}</div>
    </div>
  )
}
