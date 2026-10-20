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

/** Một nhóm trích dẫn liền nhau "[1][3]" / "[1, 3]" render thành "[1, 3]" theo kiểu IEEE. */
function CitationGroup({ numbers, citations }: { numbers: number[]; citations: Citation[] }) {
  return (
    <span className="citation-group">
      [
      {numbers.map((n, i) => {
        const citation = citations[n - 1]
        return (
          <span key={n}>
            {i > 0 && ', '}
            {citation ? (
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
                <a className="citation-ref" href={`#ref-${citation.chunkId}`} onClick={(e) => e.stopPropagation()}>
                  {n}
                </a>
              </Tooltip>
            ) : (
              n
            )}
          </span>
        )
      })}
      ]
    </span>
  )
}

// Một hoặc nhiều ngoặc trích dẫn liền nhau: [1], [1, 2], [1][3], [1], [2]
const CITE_RUN = String.raw`\[\d+(?:\s*,\s*\d+)*\](?:\s*,?\s*\[\d+(?:\s*,\s*\d+)*\])*`
const INLINE_TOKEN_RE = new RegExp(`(${CITE_RUN}|\\*\\*[^*\\n]+\\*\\*|\\*[^*\\n]+\\*|\`[^\`\\n]+\`)`, 'g')
const CITE_RUN_RE = new RegExp(`^${CITE_RUN}$`)

function citationNumbers(run: string): number[] {
  const nums = Array.from(run.matchAll(/\d+/g), (m) => parseInt(m[0], 10))
  return Array.from(new Set(nums)).sort((a, b) => a - b)
}

/**
 * Thay "[n]" bằng citation chip (khớp citations[n-1] trả về từ backend) và
 * render bold/italic cơ bản — dùng trong chat bubble. Mỗi "[n]" là một chip superscript.
 */
export function renderCitedText(text: string, citations: Citation[]): ReactNode[] {
  return renderInline(text, citations, 'chip')
}

/** Phiên bản dùng cho bài báo: trích dẫn inline kiểu IEEE "[1, 3]" cùng cỡ chữ thân bài. */
export function renderArticleInline(text: string, citations: Citation[]): ReactNode[] {
  return renderInline(text, citations, 'ieee')
}

function renderInline(text: string, citations: Citation[], mode: 'chip' | 'ieee'): ReactNode[] {
  return text
    .split(INLINE_TOKEN_RE)
    .filter((part) => part.length > 0)
    .map((part, i) => {
      if (CITE_RUN_RE.test(part)) {
        const nums = citationNumbers(part)
        if (mode === 'ieee') return <CitationGroup key={i} numbers={nums} citations={citations} />
        return (
          <span key={i}>
            {nums.map((n) => {
              const citation = citations[n - 1]
              return citation ? <CitationChip key={n} citation={citation} n={n} /> : <span key={n}>[{n}]</span>
            })}
          </span>
        )
      }
      const bold = /^\*\*([^*]+)\*\*$/.exec(part)
      if (bold) return <strong key={i}>{bold[1]}</strong>
      const italic = /^\*([^*]+)\*$/.exec(part)
      if (italic) return <em key={i}>{italic[1]}</em>
      const code = /^`([^`]+)`$/.exec(part)
      if (code) return <code key={i}>{code[1]}</code>
      return <span key={i}>{part}</span>
    })
}

/* ---------------------------------------------------------------------- */
/* Block-level parser                                                      */
/* ---------------------------------------------------------------------- */

export interface ParsedReport {
  /** Dòng "# Title" đầu tiên của report, nếu có. */
  title: string | null
  /** Các đoạn dưới heading "Abstract"/"Tóm tắt". */
  abstract: ReactNode[] | null
  /** Dòng "Keywords:"/"Từ khóa:" nếu có. */
  keywords: ReactNode[] | null
  /** Thân bài đã đánh số mục, bảng, hình. */
  body: ReactNode[]
}

const ABSTRACT_RE = /^(abstract|tóm tắt|tom tat)\s*:?$/i
const KEYWORDS_RE = /^\*{0,2}(keywords?|từ khóa|tu khoa|index terms)\*{0,2}\s*[:.]\s*(.+)$/i
const TABLE_CAPTION_RE = /^\*{0,2}(table|bảng|bang)\s*\d*\s*[:.]?\*{0,2}\s*(.*)$/i
const FIGURE_CAPTION_RE = /^\*{0,2}(figure|fig\.?|hình|hinh)\s*\d*\s*[:.]?\*{0,2}\s*(.*)$/i
const TABLE_SEP_RE = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/

function splitTableRow(line: string): string[] {
  let s = line.trim()
  if (s.startsWith('|')) s = s.slice(1)
  if (s.endsWith('|')) s = s.slice(0, -1)
  return s.split('|').map((c) => c.trim())
}

function columnAlign(sep: string): ('left' | 'center' | 'right' | null)[] {
  return splitTableRow(sep).map((c) => {
    const l = c.startsWith(':')
    const r = c.endsWith(':')
    if (l && r) return 'center'
    if (r) return 'right'
    if (l) return 'left'
    return null
  })
}

function looksNumeric(s: string): boolean {
  return /^[-+±]?\d[\d.,]*\s*%?$/.test(s.replace(/\*\*/g, '').trim())
}

/**
 * Parse markdown do backend sinh ra thành cấu trúc bài báo.
 * Hỗ trợ: heading #..######, đoạn, list -/* và 1., bảng | |, ảnh ![](), caption Table/Figure,
 * trích dẫn [n], bold/italic/code. Heading được đánh số tự động 1., 1.1., 1.1.1.
 */
export function parseReport(report: string, citations: Citation[]): ParsedReport {
  const lines = report.split('\n')

  // ---- Pass 1: tách title và tìm level heading nhỏ nhất của thân bài ----
  let title: string | null = null
  let titleLineIdx = -1
  const headingLevels: number[] = []
  lines.forEach((raw, idx) => {
    const m = /^(#{1,6})\s+(.*?)\s*#*$/.exec(raw.trim())
    if (!m) return
    const level = m[1].length
    if (title === null && level === 1 && headingLevels.length === 0) {
      title = m[2].replace(/\*\*/g, '')
      titleLineIdx = idx
      return
    }
    headingLevels.push(level)
  })
  const baseLevel = headingLevels.length ? Math.min(...headingLevels) : 2

  // ---- Pass 2: dựng blocks ----
  const body: ReactNode[] = []
  let abstract: ReactNode[] | null = null
  let keywords: ReactNode[] | null = null

  let mode: 'body' | 'abstract' = 'body'
  const counters = [0, 0, 0]
  let tableCount = 0
  let figureCount = 0

  let paragraphLines: string[] = []
  let listItems: string[] = []
  let listOrdered = false
  let tableLines: string[] = []

  const inline = (t: string) => renderArticleInline(t, citations)
  const push = (node: ReactNode) => {
    if (mode === 'abstract') (abstract ??= []).push(node)
    else body.push(node)
  }
  let keySeq = 0
  const key = () => `blk-${(keySeq += 1)}`

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return
    const text = paragraphLines.join(' ').trim()
    paragraphLines = []
    if (!text) return

    // "Keywords: a, b" ngay sau abstract hoặc trước mục đầu tiên → khối từ khóa.
    const kw = KEYWORDS_RE.exec(text)
    if (kw && !keywords && (mode === 'abstract' || body.length === 0)) {
      keywords = inline(kw[2])
      return
    }
    const fig = FIGURE_CAPTION_RE.exec(text)
    if (fig && fig[2]) {
      figureCount += 1
      push(
        <p key={key()} className="article-caption article-caption-figure">
          <strong>Hình {figureCount}.</strong> {inline(fig[2])}
        </p>,
      )
      return
    }
    push(
      <p key={key()} className="article-p">
        {inline(text)}
      </p>,
    )
  }

  const flushList = () => {
    if (listItems.length === 0) return
    const items = listItems.map((item, j) => <li key={j}>{inline(item)}</li>)
    push(listOrdered ? <ol key={key()}>{items}</ol> : <ul key={key()}>{items}</ul>)
    listItems = []
  }

  const flushTable = () => {
    if (tableLines.length === 0) return
    const rows = tableLines
    tableLines = []
    if (rows.length < 2 || !TABLE_SEP_RE.test(rows[1])) {
      // Không phải bảng hợp lệ — coi như văn bản.
      paragraphLines.push(...rows)
      flushParagraph()
      return
    }

    // Caption: nếu đoạn ngay trước là 1 dòng "Table N: ..." thì dùng làm caption.
    let captionText: string | null = null
    if (paragraphLines.length === 1) {
      const m = TABLE_CAPTION_RE.exec(paragraphLines[0].trim())
      if (m) {
        captionText = m[2]
        paragraphLines = []
      }
    }
    flushParagraph()

    const header = splitTableRow(rows[0])
    const aligns = columnAlign(rows[1])
    const bodyRows = rows.slice(2).map(splitTableRow)
    tableCount += 1

    const alignFor = (ci: number, cell: string): 'left' | 'center' | 'right' =>
      aligns[ci] ?? (looksNumeric(cell) ? 'center' : 'left')

    push(
      <div key={key()} className="article-table-wrap">
        <p className="article-caption article-caption-table">
          <strong>Bảng {tableCount}.</strong> {captionText ? inline(captionText) : null}
        </p>
        <table className="article-table">
          <thead>
            <tr>
              {header.map((h, ci) => (
                <th key={ci} style={{ textAlign: aligns[ci] ?? (ci === 0 ? 'left' : 'center') }}>
                  {inline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((r, ri) => (
              <tr key={ri}>
                {header.map((_, ci) => (
                  <td key={ci} style={{ textAlign: alignFor(ci, r[ci] ?? '') }}>
                    {inline(r[ci] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    )
  }

  const flushAll = () => {
    flushTable()
    flushList()
    flushParagraph()
  }

  const headingNumber = (depth: number): string => {
    counters[depth] += 1
    for (let d = depth + 1; d < counters.length; d += 1) counters[d] = 0
    const parts = counters.slice(0, depth + 1)
    return depth < 2 ? `${parts.join('.')}.` : parts.join('.')
  }

  lines.forEach((rawLine, idx) => {
    if (idx === titleLineIdx) return
    const line = rawLine.trim()

    // Bảng: gom các dòng bắt đầu bằng "|"
    if (line.startsWith('|')) {
      flushList()
      tableLines.push(line)
      return
    }
    flushTable()

    if (!line) {
      flushParagraph()
      flushList()
      return
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushParagraph()
      flushList()
      return
    }

    const heading = /^(#{1,6})\s+(.*?)\s*#*$/.exec(line)
    if (heading) {
      flushParagraph()
      flushList()
      const text = heading[2].replace(/\*\*/g, '').trim()

      if (ABSTRACT_RE.test(text)) {
        mode = 'abstract'
        abstract ??= []
        return
      }
      mode = 'body'

      const depth = Math.max(0, Math.min(2, heading[1].length - baseLevel))
      const num = headingNumber(depth)
      const content = (
        <>
          <span className="article-heading-num">{num}</span>
          {inline(text)}
        </>
      )
      const k = key()
      body.push(
        depth === 0 ? (
          <h2 key={k} className="article-h2">
            {content}
          </h2>
        ) : depth === 1 ? (
          <h3 key={k} className="article-h3">
            {content}
          </h3>
        ) : (
          <h4 key={k} className="article-h4">
            {content}
          </h4>
        ),
      )
      return
    }

    const image = /^!\[([^\]]*)\]\(([^)\s]+)[^)]*\)$/.exec(line)
    if (image) {
      flushParagraph()
      flushList()
      figureCount += 1
      push(
        <figure key={key()} className="article-figure-wrap">
          <img src={image[2]} alt={image[1]} className="article-figure-img" />
          <figcaption className="article-caption article-caption-figure">
            <strong>Hình {figureCount}.</strong> {inline(image[1])}
          </figcaption>
        </figure>,
      )
      return
    }

    const ul = /^[-*•]\s+(.*)$/.exec(line)
    const ol = /^\d+[.)]\s+(.*)$/.exec(line)
    if (ul || ol) {
      flushParagraph()
      const ordered = !!ol
      if (listItems.length > 0 && ordered !== listOrdered) flushList()
      listOrdered = ordered
      listItems.push((ul ?? ol)![1])
      return
    }

    const quote = /^>\s?(.*)$/.exec(line)
    if (quote) {
      flushList()
      paragraphLines.push(quote[1])
      return
    }

    flushList()
    // Dòng mở đầu bằng cụm in đậm ("**Tiêu đề đoạn.** ...") là một đoạn mới, theo kiểu paragraph heading.
    if (paragraphLines.length > 0 && /^\*\*[^*]+\*\*/.test(line)) flushParagraph()
    paragraphLines.push(line)
  })
  flushAll()

  // Các biến này được gán trong closure nên TS không thu hẹp kiểu đúng.
  const abstractOut = abstract as ReactNode[] | null
  const keywordsOut = keywords as ReactNode[] | null
  return {
    title: title as string | null,
    abstract: abstractOut && abstractOut.length > 0 ? abstractOut : null,
    keywords: keywordsOut,
    body,
  }
}

/** Tương thích ngược: trả về toàn bộ blocks (title, abstract, body) thành một mảng. */
export function renderReportMarkdown(report: string, citations: Citation[]): ReactNode[] {
  const parsed = parseReport(report, citations)
  const out: ReactNode[] = []
  if (parsed.title) out.push(<h1 key="title">{parsed.title}</h1>)
  if (parsed.abstract) out.push(...parsed.abstract)
  out.push(...parsed.body)
  return out
}
