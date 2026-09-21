import { useEffect, useRef, useState } from 'react'
import {
  Save,
  FileDown,
  FileText,
  Share2,
  RefreshCw,
  MessageCircle,
  Pencil,
  Sparkles,
  Repeat,
  Maximize2,
  Minimize2,
  Quote,
  Check,
} from 'lucide-react'
import { useApp } from '../../state/AppContext'
import ArticleContent from './ArticleContent'

export default function ArticleView() {
  const { setActiveTab } = useApp()
  const [saved, setSaved] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [toolbar, setToolbar] = useState<{ top: number; left: number } | null>(null)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  useEffect(() => {
    const onMouseUp = () => {
      const sel = window.getSelection()
      const container = scrollRef.current
      if (!sel || sel.isCollapsed || !container || !container.contains(sel.anchorNode)) {
        setToolbar(null)
        return
      }
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      if (rect.width === 0) {
        setToolbar(null)
        return
      }
      const top = Math.max(rect.top - 46, 8)
      let left = rect.left + rect.width / 2 - 140
      left = Math.max(8, Math.min(left, window.innerWidth - 300))
      setToolbar({ top, left })
    }
    document.addEventListener('mouseup', onMouseUp)
    return () => document.removeEventListener('mouseup', onMouseUp)
  }, [])

  return (
    <div className="article-view">
      <div className="article-toolbar scrollbar-thin">
        <button className="toolbar-btn primary" onClick={save}>
          {saved ? <Check size={14} /> : <Save size={14} />} {saved ? 'Saved' : 'Save'}
        </button>
        <button className="toolbar-btn">
          <FileDown size={14} /> Export PDF
        </button>
        <button className="toolbar-btn">
          <FileText size={14} /> Export DOCX
        </button>
        <button className="toolbar-btn">
          <Share2 size={14} /> Share
        </button>
        <button className="toolbar-btn">
          <RefreshCw size={14} /> Regenerate
        </button>
        <div className="toolbar-spacer" />
        <button className="toolbar-btn link" onClick={() => setActiveTab('research')}>
          <MessageCircle size={14} /> Continue with AI
        </button>
      </div>

      {toolbar && (
        <div className="selection-toolbar" style={{ top: toolbar.top, left: toolbar.left }}>
          <button>
            <Pencil size={12} /> Edit
          </button>
          <button>
            <Sparkles size={12} /> AI Improve
          </button>
          <button>
            <Repeat size={12} /> Rewrite
          </button>
          <button>
            <Maximize2 size={12} /> Expand
          </button>
          <button>
            <Minimize2 size={12} /> Shorten
          </button>
          <button>
            <Quote size={12} /> Add citation
          </button>
        </div>
      )}

      <div className="article-scroll scrollbar-thin" ref={scrollRef}>
        <ArticleContent />
      </div>
    </div>
  )
}
