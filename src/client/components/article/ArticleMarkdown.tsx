import { useMemo, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import type { Citation } from '../../../types'
import { renderArticleInline } from '../../lib/reportText'
import ChartFigure, { parseChartSpec } from './ChartFigure'
import MermaidDiagram from './MermaidDiagram'

/**
 * Render markdown học thuật do research agent sinh ra: GFM (bảng), công thức $..$/$$..$$ (KaTeX),
 * khối ```chart``` -> SVG, ```mermaid``` -> sơ đồ, trích dẫn [n] -> nhóm IEEE có tooltip.
 *
 * Số thứ tự Bảng/Hình được gán trong remark plugin (thuộc tính data-index trên node), KHÔNG đếm
 * bằng biến khi render — React StrictMode render hai lần nên mọi bộ đếm kiểu side-effect sẽ sai.
 */

const LOOSE_CAPTION_RE = /^(table|bảng|figure|fig\.?|hình)\s*\d*\s*[:.]/i
const TABLE_CAPTION_LINE_RE = /^\s*\*\*\s*(?:Table|Bảng)\s*\d*\s*[:.]?\s*([^*]*?)\s*\*\*\s*$/i
const CAPTION_MARKER_RE = /^<!--caption:(.*)-->$/

/** "**Table 1: caption**" ngay trước một bảng -> marker để plugin gắn caption vào bảng đó. */
function preprocess(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  for (let i = 0; i < lines.length; i += 1) {
    const m = TABLE_CAPTION_LINE_RE.exec(lines[i])
    if (m) {
      let j = i + 1
      while (j < lines.length && !lines[j].trim()) j += 1
      if (j < lines.length && lines[j].trim().startsWith('|')) {
        out.push(`<!--caption:${encodeURIComponent(m[1].trim())}-->`, '')
        i = j - 1
        continue
      }
    }
    out.push(lines[i])
  }
  return out.join('\n')
}

interface MdNode {
  type: string
  lang?: string | null
  value?: string
  data?: Record<string, unknown>
  children?: MdNode[]
}

function setProps(node: MdNode, props: Record<string, string | number>) {
  const data = (node.data ?? {}) as { hProperties?: Record<string, unknown> }
  node.data = { ...data, hProperties: { ...(data.hProperties ?? {}), ...props } }
}

/**
 * remark plugin: (1) gắn caption từ marker vào bảng kế tiếp, (2) đánh số Bảng/Hình theo thứ tự
 * xuất hiện trong tài liệu và lưu vào data-index.
 */
function remarkFigureNumbering() {
  return (tree: MdNode) => {
    const kids = tree.children ?? []
    let tableIndex = 0
    let figureIndex = 0

    for (let i = 0; i < kids.length; i += 1) {
      const node = kids[i]

      if (node.type === 'html' && typeof node.value === 'string') {
        const m = CAPTION_MARKER_RE.exec(node.value.trim())
        if (m) {
          const next = kids[i + 1]
          if (next?.type === 'table') setProps(next, { 'data-caption': decodeURIComponent(m[1]) })
          kids.splice(i, 1)
          i -= 1
          continue
        }
      }

      if (node.type === 'table') {
        tableIndex += 1
        setProps(node, { 'data-index': tableIndex })
      } else if (node.type === 'code' && (node.lang === 'chart' || node.lang === 'mermaid')) {
        figureIndex += 1
        setProps(node, { 'data-index': figureIndex })
      }
    }
  }
}

/** Áp dụng trích dẫn [n] lên mọi text node con, giữ nguyên các element khác. */
function withCitations(children: ReactNode, citations: Citation[]): ReactNode {
  if (typeof children === 'string') return renderArticleInline(children, citations)
  if (Array.isArray(children)) {
    return children.map((child, i) =>
      typeof child === 'string' ? <span key={i}>{renderArticleInline(child, citations)}</span> : child,
    )
  }
  return children
}

export default function ArticleMarkdown({ markdown, citations }: { markdown: string; citations: Citation[] }) {
  const source = useMemo(() => preprocess(markdown), [markdown])

  const components = useMemo<Components>(() => {
    const cite = (c: ReactNode) => withCitations(c, citations)
    return {
      h1: ({ children }) => <h1 className="article-title">{cite(children)}</h1>,
      h2: ({ children }) => <h2 className="article-h2">{cite(children)}</h2>,
      h3: ({ children }) => <h3 className="article-h3">{cite(children)}</h3>,
      h4: ({ children }) => <h4 className="article-h4">{cite(children)}</h4>,
      h5: ({ children }) => <h5 className="article-h4">{cite(children)}</h5>,
      h6: ({ children }) => <h6 className="article-h4">{cite(children)}</h6>,
      p: ({ children, node }) => {
        const first = node?.children?.[0]
        const isCaption =
          node?.children?.length === 1 &&
          first?.type === 'element' &&
          first.tagName === 'strong' &&
          first.children?.[0]?.type === 'text' &&
          LOOSE_CAPTION_RE.test(first.children[0].value)
        return <p className={isCaption ? 'article-caption article-caption-loose' : 'article-p'}>{cite(children)}</p>
      },
      li: ({ children }) => <li>{cite(children)}</li>,
      td: ({ children, style }) => <td style={style}>{cite(children)}</td>,
      th: ({ children, style }) => <th style={style}>{cite(children)}</th>,
      blockquote: ({ children }) => <blockquote className="article-quote">{children}</blockquote>,
      hr: () => <hr className="article-hr" />,
      a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="article-link">
          {children}
        </a>
      ),
      table: (props) => {
        const extra = props as { 'data-caption'?: string; 'data-index'?: string | number }
        const caption = extra['data-caption'] ?? null
        const index = Number(extra['data-index'] ?? 1)
        return (
          <div className="article-table-wrap">
            <p className="article-caption article-caption-table">
              <strong>Bảng {index}.</strong> {caption ? cite(caption) : null}
            </p>
            <div className="article-table-scroll">
              <table className="article-table">{props.children}</table>
            </div>
          </div>
        )
      },
      pre: ({ children }) => <>{children}</>,
      code: (props) => {
        const { className, children, node } = props
        const extra = props as { 'data-index'?: string | number }
        const raw = String(children ?? '').replace(/\n$/, '')
        const lang = /language-(\w+)/.exec(className ?? '')?.[1]
        const multiline = node?.position ? node.position.start.line !== node.position.end.line : raw.includes('\n')
        if (!multiline && !lang) return <code className="article-inline-code">{raw}</code>

        const index = Number(extra['data-index'] ?? 1)
        if (lang === 'chart') {
          const spec = parseChartSpec(raw)
          if (spec) return <ChartFigure spec={spec} index={index} />
        }
        if (lang === 'mermaid') return <MermaidDiagram code={raw} index={index} />

        return (
          <pre className="article-code" data-lang={lang ?? ''}>
            <code>{raw}</code>
          </pre>
        )
      },
    }
  }, [citations])

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath, remarkFigureNumbering]}
      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
      components={components}
    >
      {source}
    </ReactMarkdown>
  )
}
