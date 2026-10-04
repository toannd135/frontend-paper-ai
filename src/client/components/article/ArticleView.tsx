import { useState } from 'react'
import { App as AntApp, Tooltip } from 'antd'
import { FileDown, FileText, Copy, Check, MessageCircle, Download } from 'lucide-react'
import { useApp } from '../../state/AppContext'
import { researchPdfUrl } from '../../api/research'
import ArticleContent from './ArticleContent'

export default function ArticleView() {
  const { state, setActiveTab } = useApp()
  const { message } = AntApp.useApp()
  const [copied, setCopied] = useState(false)
  const taskId = state.researchTaskId
  const hasReport = !!state.report

  const copyMarkdown = async () => {
    if (!state.report) return
    try {
      await navigator.clipboard.writeText(state.report)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      message.error('Trình duyệt không cho phép truy cập clipboard.')
    }
  }

  const downloadMarkdown = () => {
    if (!state.report) return
    const blob = new Blob([state.report], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paperai-${(taskId ?? 'report').slice(0, 8)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const openPdf = (engine: 'typst' | 'html') => {
    if (!taskId) return
    window.open(researchPdfUrl(taskId, { engine }), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="article-view">
      <div className="article-toolbar scrollbar-thin">
        <Tooltip title="PDF 2 cột chuẩn hội nghị (Typst). Lần đầu có thể mất vài giây để biên dịch.">
          <button className="toolbar-btn primary" onClick={() => openPdf('typst')} disabled={!taskId || !hasReport}>
            <FileDown size={14} /> Xuất PDF
          </button>
        </Tooltip>
        <Tooltip title="PDF 1 cột render từ HTML (Chromium) — dùng khi Typst lỗi với công thức phức tạp.">
          <button className="toolbar-btn" onClick={() => openPdf('html')} disabled={!taskId || !hasReport}>
            <FileText size={14} /> PDF (HTML)
          </button>
        </Tooltip>
        <button className="toolbar-btn" onClick={downloadMarkdown} disabled={!hasReport}>
          <Download size={14} /> Tải Markdown
        </button>
        <button className="toolbar-btn" onClick={copyMarkdown} disabled={!hasReport}>
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Đã sao chép' : 'Sao chép'}
        </button>
        <div className="toolbar-spacer" />
        <button className="toolbar-btn link" onClick={() => setActiveTab('research')}>
          <MessageCircle size={14} /> Tiếp tục với AI
        </button>
      </div>

      <div className="article-scroll scrollbar-thin">
        <ArticleContent />
      </div>
    </div>
  )
}
