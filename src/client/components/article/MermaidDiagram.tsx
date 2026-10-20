import { useEffect, useId, useState } from 'react'
import { normalizeMermaidMath } from '../../lib/mermaidMath'

/**
 * Render sơ đồ ```mermaid``` phía client. Thư viện mermaid nặng (~2MB) nên được nạp lười (dynamic import)
 * chỉ khi báo cáo thực sự có sơ đồ; nếu cú pháp lỗi thì hiển thị mã nguồn thay vì làm hỏng cả bài.
 */
export default function MermaidDiagram({ code, index }: { code: string; index: number }) {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'strict',
          htmlLabels: true,
          fontFamily: 'Inter, system-ui, sans-serif',
          flowchart: { htmlLabels: true, useMaxWidth: true, rankSpacing: 65 },
        })
        const { svg: rendered } = await mermaid.render(`mermaid-${id}`, normalizeMermaidMath(code))
        if (!cancelled) setError(null)
        if (!cancelled) setSvg(rendered)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Không render được sơ đồ')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [code, id])

  if (error) {
    return (
      <figure className="article-figure-wrap">
        <pre className="article-code article-code-fallback">
          <code>{code}</code>
        </pre>
        <figcaption className="article-caption">
          <strong>Hình {index}.</strong> Sơ đồ (không render được: {error.split('\n')[0]})
        </figcaption>
      </figure>
    )
  }

  return (
    <figure className="article-figure-wrap">
      {svg ? (
        <div className="article-mermaid" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="article-mermaid article-mermaid-loading">Đang dựng sơ đồ…</div>
      )}
      <figcaption className="article-caption">
        <strong>Hình {index}.</strong> Sơ đồ kiến trúc / luồng xử lý
      </figcaption>
    </figure>
  )
}
