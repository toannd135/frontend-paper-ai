import { useApp } from '../../state/AppContext'
import { renderReportMarkdown } from '../../lib/reportText'

export default function ArticleContent() {
  const { state } = useApp()

  if (!state.report) {
    return (
      <div className="article-paper article-prose">
        <p className="article-eyebrow not-article">Research Article</p>
        <h1 className="article-title">{state.topic || 'Bài báo nghiên cứu'}</h1>
        <p>Chưa có nội dung — báo cáo sẽ hiển thị ở đây sau khi quá trình nghiên cứu hoàn tất.</p>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('vi-VN')

  return (
    <div className="article-paper article-prose">
      <p className="article-eyebrow not-article">Research Article</p>
      <p className="article-meta not-article">PaperAI Research Assistant · {today}</p>

      {renderReportMarkdown(state.report, state.citations)}

      {state.citations.length > 0 && (
        <section className="article-references">
          <h2 className="not-article">Tài liệu tham khảo</h2>
          <ol>
            {state.citations.map((c, i) => (
              <li id={`ref-${c.chunkId}`} key={c.chunkId}>
                <span className="ref-index">[{i + 1}]</span>
                <span>
                  paper {c.paperId}
                  {c.section ? ` · ${c.section}` : ''}
                  {c.page != null ? ` · trang ${c.page}` : ''} — {c.textSnippet}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
