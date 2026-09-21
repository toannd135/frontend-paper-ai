import { Check } from 'lucide-react'
import { AiAvatar } from './AiBubble'

interface QuestionCardProps {
  prompt: string
  options: string[]
  answered: boolean
  selectedIndex: number | null
  onSelect: (index: number) => void
}

export default function QuestionCard({ prompt, options, answered, selectedIndex, onSelect }: QuestionCardProps) {
  return (
    <div className="chat-row ai animate-fade-up">
      <AiAvatar />
      <div style={{ maxWidth: '70%' }}>
        <div className="bubble ai" style={{ marginBottom: 10, display: 'inline-block' }}>
          {prompt}
        </div>
        <div className="option-group">
          {options.map((opt, i) => {
            const selected = selectedIndex === i
            return (
              <button
                key={opt}
                disabled={answered}
                onClick={() => onSelect(i)}
                className={`option-btn${selected ? ' selected' : ''}`}
              >
                {selected && <Check size={14} color="var(--color-gold-hover)" />}
                <span>{opt}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
