import { useMemo } from 'react'
import { useApp } from '../../state/AppContext'
import { renderArticleInline } from '../../lib/reportText'
import ArticleMarkdown from './ArticleMarkdown'

/**
 * Tách front matter (title, authors, abstract, keywords) khỏi thân bài để dàn trang kiểu tạp chí;
 * bỏ mục "## References" do backend nối thêm vì danh mục tham khảo được render có cấu trúc từ `citations`.
 */
interface FrontMatter {
  title: string | null
  authors: string | null
  affiliations: string | null
  abstract: string | null
  keywords: string | null
  body: string
}

const AUTHORS_RE = /^\*\*Authors:\*\*\s*(.*?)\s*(?:\|\s*\*\*Affiliations:\*\*\s*(.*?))?\s*$/im
const KEYWORDS_RE = /^\*\*(?:Keywords|Từ khóa|Index Terms):\*\*\s*(.+)$/im

export function splitFrontMatter(markdown: string): FrontMatter {
  let md = markdown.replace(/\r\n/g, '\n')

  // References do backend nối: "## References\n[1] ...". Cắt bỏ tới hết (luôn là mục cuối).
  md = md.replace(/\n##\s+(?:References|Tài liệu tham khảo)\s*\n[\s\S]*$/i, '\n')

  let title: string | null = null
  const titleMatch = /^#\s+(.+?)\s*#*\s*$/m.exec(md)
  if (titleMatch) {
    title = titleMatch[1].replace(/\*\*/g, '').trim()
    md = md.replace(titleMatch[0], '')
  }

  let authors: string | null = null
  let affiliations: string | null = null
  const authorsMatch = AUTHORS_RE.exec(md)
  if (authorsMatch) {
    authors = authorsMatch[1].trim() || null
    affiliations = authorsMatch[2]?.trim() || null
    md = md.replace(authorsMatch[0], '')
  }

  let abstract: string | null = null
  let keywords: string | null = null
  const abstractMatch = /^##\s+(?:Abstract|Tóm tắt)\s*\n([\s\S]*?)(?=\n##\s|\s*$)/im.exec(md)
  if (abstractMatch) {
    let abs = abstractMatch[1].trim()
    const kw = KEYWORDS_RE.exec(abs)
    if (kw) {
      keywords = kw[1].trim()
      abs = abs.replace(kw[0], '').trim()
    }
    abstract = abs || null
    md = md.replace(abstractMatch[0], '\n')
  }
  if (!keywords) {
    const kw = KEYWORDS_RE.exec(md)
    if (kw) {
      keywords = kw[1].trim()
      md = md.replace(kw[0], '')
    }
  }

  return { title, authors, affiliations, abstract, keywords, body: md.trim() }
}

export default function ArticleContent() {
  const { state } = useApp()
  const front = useMemo(() => (state.report ? splitFrontMatter(state.report) : null), [state.report])

  if (!state.report || !front) {
    return (
      <div className="article-paper article-prose">
        <p className="article-eyebrow not-article">Research Article</p>
        <h1 className="article-title">{state.topic || 'Bài báo nghiên cứu'}</h1>
        <p className="article-p">
          Chưa có nội dung — báo cáo sẽ hiển thị ở đây sau khi quá trình nghiên cứu hoàn tất.
        </p>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('vi-VN')
  const citations = state.citations

  return (
    <article className="article-paper article-prose" data-testid="article-paper">
      <p className="article-eyebrow not-article">Research Article</p>
      <h1 className="article-title">{front.title ?? state.topic}</h1>
      <p className="article-meta not-article">
        {front.authors ?? 'PaperAI Research Assistant'}
        {front.affiliations ? ` · ${front.affiliations}` : ''} · {today}
      </p>

      {front.abstract && (
        <section className="article-abstract">
          <h2>Abstract</h2>
          <ArticleMarkdown markdown={front.abstract} citations={citations} />
          {front.keywords && (
            <p className="article-keywords">
              <strong>Keywords:</strong> {renderArticleInline(front.keywords, citations)}
            </p>
          )}
        </section>
      )}

      <div className="article-body">
        <ArticleMarkdown markdown={front.body} citations={citations} />
      </div>

      {citations.length > 0 && (
        <section className="article-references">
          <h2 className="not-article">Tài liệu tham khảo</h2>
          <ol>
            {citations.map((c, i) => (
              <li id={`ref-${c.chunkId}`} key={`${c.chunkId}-${i}`}>
                <span className="ref-index">[{i + 1}]</span>
                <span>
                  <span className="ref-paper">{c.paperId}</span>
                  {c.section ? ` · ${c.section}` : ''}
                  {c.page != null ? ` · trang ${c.page}` : ''}
                  {c.textSnippet ? <span className="ref-snippet"> — “{c.textSnippet}”</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  )
}
