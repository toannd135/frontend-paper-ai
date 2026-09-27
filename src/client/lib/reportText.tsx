import type { ReactNode } from 'react'
import { Tooltip } from 'antd'
import type { Citation } from '../../types'

function CitationChip({ citation, n }: { citation: Citation; n: number }) {
  return (
    <Tooltip
      title={
        <span>
          <span style={{ opacity: 0.75 }}>
            {citation.section ?? 'Không rõ mục'} · trang {citation.page ?? '?'}
          </span>
          <br />
          {citation.textSnippet}
        </span>
      }
    >
      <sup className="citation-chip">[{n}]</sup>
    </Tooltip>
  )
}

const INLINE_TOKEN_RE = /(\[\d+\]|\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g

// Thay "[n]" bằng citation chip (khớp citations[n-1] trả về từ backend) và
// render bold/italic cơ bản — report do LLM sinh ra dùng cả hai.
export function renderCitedText(text: string, citations: Citation[]): ReactNode[] {
  return text
    .split(INLINE_TOKEN_RE)
    .filter((part) => part.length > 0)
    .map((part, i) => {
      const cite = /^\[(\d+)\]$/.exec(part)
      if (cite) {
        const n = parseInt(cite[1], 10)
        const citation = citations[n - 1]
        return citation ? <CitationChip key={i} citation={citation} n={n} /> : <span key={i}>{part}</span>
      }
      const bold = /^\*\*([^*]+)\*\*$/.exec(part)
      if (bold) return <strong key={i}>{bold[1]}</strong>
      const italic = /^\*([^*]+)\*$/.exec(part)
      if (italic) return <em key={i}>{italic[1]}</em>
      return <span key={i}>{part}</span>
    })
}

/** Render report markdown (heading #/##, list -/*, citation [n]) do backend sinh ra thành JSX. */
export function renderReportMarkdown(report: string, citations: Citation[]): ReactNode[] {
  const blocks: ReactNode[] = []
  let paragraphLines: string[] = []
  let listItems: string[] = []

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return
    const text = paragraphLines.join(' ').trim()
    if (text) blocks.push(<p key={blocks.length}>{renderCitedText(text, citations)}</p>)
    paragraphLines = []
  }
  const flushList = () => {
    if (listItems.length === 0) return
    blocks.push(
      <ul key={blocks.length}>
        {listItems.map((item, j) => (
          <li key={j}>{renderCitedText(item, citations)}</li>
        ))}
      </ul>,
    )
    listItems = []
  }

  for (const rawLine of report.split('\n')) {
    const line = rawLine.trim()
    if (!line) {
      flushParagraph()
      flushList()
      continue
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      flushParagraph()
      flushList()
      const content = renderCitedText(heading[2], citations)
      const level = heading[1].length
      blocks.push(
        level === 1 ? (
          <h1 key={blocks.length}>{content}</h1>
        ) : level === 2 ? (
          <h2 key={blocks.length}>{content}</h2>
        ) : (
          <h3 key={blocks.length}>{content}</h3>
        ),
      )
      continue
    }

    const listItem = /^[-*]\s+(.*)$/.exec(line)
    if (listItem) {
      flushParagraph()
      listItems.push(listItem[1])
      continue
    }

    flushList()
    paragraphLines.push(line)
  }
  flushParagraph()
  flushList()

  return blocks
}
