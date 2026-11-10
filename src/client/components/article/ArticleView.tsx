import { useState } from 'react'
import { App as AntApp, Dropdown, Tooltip, type MenuProps } from 'antd'
import { FileDown, FileText, Copy, Check, MessageCircle, Download, FileCode2, ChevronDown } from 'lucide-react'
import { useApp } from '../../state/AppContext'
import {
  lintResearchReport,
  researchExportUrl,
  researchPdfUrl,
  type ExportVenue,
} from '../../api/research'
import ArticleContent from './ArticleContent'

const VENUES: { key: ExportVenue; label: string }[] = [
  { key: 'ieee', label: 'IEEE (IEEEtran)' },
  { key: 'cvpr', label: 'CVPR / ICCV (cần cvpr.sty)' },
  { key: 'neurips', label: 'NeurIPS / ICLR (cần neurips.sty)' },
  { key: 'acl', label: 'ACL / EMNLP (cần acl.sty)' },
  { key: 'acm', label: 'ACM (acmart)' },
  { key: 'elsevier', label: 'Elsevier (elsarticle)' },
  { key: 'medical', label: 'Y sinh (IMRaD, Vancouver)' },
]

export default function ArticleView() {
  const { state, setActiveTab } = useApp()
  const { message, modal } = AntApp.useApp()
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

  const download = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const exportLatex = async (venue: ExportVenue) => {
    if (!taskId) return
    try {
      const warnings = await lintResearchReport(taskId, venue)
      if (warnings.length) {
        modal.confirm({
          title: `${warnings.length} cảnh báo trước khi xuất`,
          content: (
            <ul className="export-warnings">
              {warnings.map((w, i) => <li key={i}>{w.message}</li>)}
            </ul>
          ),
          okText: 'Vẫn tải gói LaTeX',
          cancelText: 'Huỷ',
          onOk: () => download(researchExportUrl(taskId, 'latex', { venue })),
        })
        return
      }
    } catch {
      // Lint lỗi không chặn việc xuất
    }
    download(researchExportUrl(taskId, 'latex', { venue }))
  }

  const exportMenu: MenuProps = {
    items: [
      { type: 'group', label: 'Gói LaTeX theo nơi nộp', children: VENUES.map((v) => ({ key: `latex:${v.key}`, label: v.label })) },
      { type: 'divider' },
      { key: 'bib', label: 'BibTeX (.bib)' },
      { key: 'ris', label: 'RIS (EndNote, Zotero)' },
      { key: 'csl', label: 'CSL-JSON' },
      { key: 'figures.zip', label: 'Hình tách file (PDF/EPS/PNG)' },
    ],
    onClick: ({ key }) => {
      if (!taskId) return
      if (key.startsWith('latex:')) {
        void exportLatex(key.slice('latex:'.length) as ExportVenue)
      } else {
        download(researchExportUrl(taskId, key as 'bib' | 'ris' | 'csl' | 'figures.zip'))
      }
    },
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
        <Dropdown menu={exportMenu} trigger={['click']} disabled={!taskId || !hasReport}>
          <button className="toolbar-btn" disabled={!taskId || !hasReport}>
            <FileCode2 size={14} /> LaTeX & trích dẫn <ChevronDown size={12} />
          </button>
        </Dropdown>
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
