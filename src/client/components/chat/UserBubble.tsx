export default function UserBubble({ text }: { text: string }) {
  return (
    <div className="chat-row user animate-fade-up">
      <div className="bubble user">{text}</div>
    </div>
  )
}
