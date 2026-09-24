import { Modal, Progress, Tag } from 'antd'
import { Check, ExternalLink, Sparkles } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { aiSummaries, keyFindingsPool, limitationsPool, methodologyPool } from '../../data/mock'

export default function PaperModal() {
  const { state, closePaperModal, toggleSelectSource } = useApp()
  const paper = state.sources.find((s) => s.id === state.modalSourceId) || null

  if (!paper) {
    return <Modal open={false} footer={null} onCancel={closePaperModal} destroyOnClose />
  }

  let hash = 0
  for (let i = 0; i < paper.id.length; i += 1) hash = (hash * 31 + paper.id.charCodeAt(i)) | 0
  const idx = Math.abs(hash)
  const summary = aiSummaries[idx % aiSummaries.length]
  const findings = keyFindingsPool[idx % keyFindingsPool.length]
  const methodology = methodologyPool[idx % methodologyPool.length]
  const limitation = limitationsPool[idx % limitationsPool.length]
  const selected = state.selectedIds.has(paper.id)

  return (
    <Modal
      open={!!state.modalSourceId}
      onCancel={closePaperModal}
      footer={null}
      width={560}
      destroyOnClose
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-hairline)' }}>
        <Tag color="#087F73" style={{ background: 'rgba(8,127,115,0.1)', color: 'var(--color-primary)', border: 0 }}>
          {paper.type}
        </Tag>
        <h2 style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.4, margin: '10px 0 4px' }}>{paper.title}</h2>
        <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', margin: 0 }}>{paper.authors}</p>
      </div>

      <div style={{ padding: '20px 24px', maxHeight: '55vh', overflowY: 'auto' }} className="scrollbar-thin">
        <div className="paper-modal-grid" style={{ marginBottom: 20 }}>
          <div>
            <p className="g-label">Year</p>
            <p className="g-value">{paper.year}</p>
          </div>
          <div>
            <p className="g-label">Publisher</p>
            <p className="g-value">{paper.publisher}</p>
          </div>
          <div>
            <p className="g-label">DOI</p>
            <p className="g-value">{paper.doi}</p>
          </div>
          <div>
            <p className="g-label">Citations</p>
            <p className="g-value">{paper.citations}</p>
          </div>
        </div>

        <div className="paper-modal-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <p className="paper-modal-label" style={{ margin: 0 }}>
              Relevance score
            </p>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-gold-hover)', margin: 0 }}>
              {paper.relevance}%
            </p>
          </div>
          <Progress percent={paper.relevance} showInfo={false} strokeColor="#D9A441" size="small" />
        </div>

        <div className="paper-modal-section">
          <p className="paper-modal-label">Abstract</p>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, fontFamily: "'Source Serif 4', Georgia, serif" }}>
            {paper.abstract ||
              'Bài báo này chưa có abstract công khai trên OpenAlex (thường do nhà xuất bản không cho phép chỉ mục).'}
          </p>
        </div>

        <div className="ai-summary-box paper-modal-section">
          <p className="paper-modal-label">
            <Sparkles size={14} /> AI Summary
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>{summary}</p>
        </div>

        <div className="paper-modal-section">
          <p className="paper-modal-label">Key findings</p>
          <ul className="findings-list">
            {findings.map((f) => (
              <li key={f}>
                <Check size={14} color="var(--color-primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="paper-modal-section">
          <p className="paper-modal-label">Research methodology</p>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>{methodology}</p>
        </div>

        <div className="paper-modal-section" style={{ marginBottom: 0 }}>
          <p className="paper-modal-label">Limitations</p>
          <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>{limitation}</p>
        </div>
      </div>

      <div
        style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--color-hairline)',
          display: 'flex',
          gap: 10,
        }}
      >
        <button
          onClick={() => {
            toggleSelectSource(paper.id)
            closePaperModal()
          }}
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            borderRadius: 9,
            padding: '10px',
            border: selected ? '1px solid rgba(8,127,115,0.3)' : 0,
            background: selected ? 'rgba(8,127,115,0.1)' : 'var(--color-gold)',
            color: selected ? 'var(--color-primary)' : '#fff',
            cursor: 'pointer',
          }}
        >
          {selected ? 'Remove from research' : 'Add to research'}
        </button>
        <button
          disabled={!paper.doi}
          onClick={() => paper.doi && window.open(`https://doi.org/${paper.doi}`, '_blank', 'noopener,noreferrer')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 500,
            border: '1px solid var(--color-hairline)',
            borderRadius: 9,
            padding: '10px 16px',
            background: 'transparent',
            cursor: paper.doi ? 'pointer' : 'not-allowed',
            opacity: paper.doi ? 1 : 0.5,
          }}
        >
          <ExternalLink size={14} /> Open source
        </button>
      </div>
    </Modal>
  )
}
