import { useState } from 'react'
import { App as AntApp, Segmented, Tooltip } from 'antd'
import { FileDown, FileText, Copy, Check, MessageCircle, Download, FileArchive, BookMarked } from 'lucide-react'
import { useApp } from '../../state/AppContext'
import type { ExportKind, PaperTemplate, PdfEngine } from '../../api/research'
import { useResearchExport } from '../../lib/useOpenResearchPdf'
import ArticleContent from './ArticleContent'

export default function ArticleView() {
  const { state, setActiveTab } = useApp()
  const runExport = useResearchExport()
  const [template, setTemplate] = useState<PaperTemplate>('ieee')
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

  const exportAs = (kind: ExportKind, engine?: PdfEngine) => {
    if (!taskId) return
    void runExport(taskId, kind, { engine, template })
  }
  const disabled = !taskId || !hasReport

  return (
    <div className="article-view">
      <div className="article-toolbar scrollbar-thin">
        <Tooltip title="Mẫu trình bày cho PDF LaTeX và gói LaTeX">
          <Segmented<PaperTemplate>
            size="small"
            value={template}
            onChange={setTemplate}
            options={[
              { label: 'IEEE', value: 'ieee' },
              { label: 'CVPR', value: 'cvpr' },
            ]}
          />
        </Tooltip>
        <Tooltip title="PDF 2 cột (LaTeX, theo mẫu đã chọn). Lần đầu có thể mất vài giây để biên dịch; lỗi biên dịch thì backend tự lùi về HTML.">
          <button className="toolbar-btn primary" onClick={() => exportAs('pdf', 'latex')} disabled={disabled}>
            <FileDown size={14} /> Xuất PDF
          </button>
        </Tooltip>
        <Tooltip title="PDF 1 cột render từ HTML (Chromium) — dùng khi bản LaTeX lỗi với công thức phức tạp.">
          <button className="toolbar-btn" onClick={() => exportAs('pdf', 'html')} disabled={disabled}>
            <FileText size={14} /> PDF (HTML)
          </button>
        </Tooltip>
        <Tooltip title="Gói zip: paper.tex + references.bib + figures/ để nộp bài hoặc sửa tiếp trên Overleaf.">
          <button className="toolbar-btn" onClick={() => exportAs('latex')} disabled={disabled}>
            <FileArchive size={14} /> LaTeX (.zip)
          </button>
        </Tooltip>
        <Tooltip title="references.bib, cite key ref{n} khớp [n] trong báo cáo.">
          <button className="toolbar-btn" onClick={() => exportAs('bib')} disabled={disabled}>
            <BookMarked size={14} /> BibTeX
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
