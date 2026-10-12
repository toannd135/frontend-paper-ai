import { Modal, Progress, Tag } from 'antd'
import { ExternalLink } from 'lucide-react'
import { useApp } from '../state/AppContext'

/**
 * Chi tiết 1 nguồn OpenAlex. Chỉ hiển thị dữ liệu thật (metadata + abstract), không có phần tóm tắt giả lập.
 * Không còn nút thêm/bỏ nguồn: research agent luôn tìm trên toàn bộ kho nên việc chọn thủ công không
 * ảnh hưởng tới kết quả, giữ lại chỉ gây hiểu nhầm.
 */
export default function PaperModal() {
  const { state, closePaperModal } = useApp()
  const paper = state.sources.find((s) => s.id === state.modalSourceId) || null

  if (!paper) {
    return <Modal open={false} footer={null} onCancel={closePaperModal} destroyOnHidden />
  }

  const openAlexUrl = `https://openalex.org/${paper.id}`

  return (
    <Modal
      open={!!state.modalSourceId}
      onCancel={closePaperModal}
      footer={null}
      width={560}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
    >
      <div className="paper-modal-head">
        <Tag color="#087F73" style={{ background: 'rgba(8,127,115,0.1)', color: 'var(--color-primary)', border: 0 }}>
          {paper.type}
        </Tag>
        <h2 className="paper-modal-title">{paper.title}</h2>
        <p className="paper-modal-authors">{paper.authors}</p>
      </div>

      <div className="paper-modal-body scrollbar-thin">
        <div className="paper-modal-grid" style={{ marginBottom: 20 }}>
          <div>
            <p className="g-label">Năm</p>
            <p className="g-value">{paper.year || '—'}</p>
          </div>
          <div>
            <p className="g-label">Nguồn xuất bản</p>
            <p className="g-value">{paper.publisher}</p>
          </div>
          <div>
            <p className="g-label">DOI</p>
            <p className="g-value">{paper.doi || '—'}</p>
          </div>
          <div>
            <p className="g-label">Lượt trích dẫn</p>
            <p className="g-value">{paper.citations.toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="paper-modal-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <p className="paper-modal-label" style={{ margin: 0 }}>
              Độ liên quan (theo thứ hạng OpenAlex)
            </p>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-gold-hover)', margin: 0 }}>
              {paper.relevance}%
            </p>
          </div>
          <Progress percent={paper.relevance} showInfo={false} strokeColor="#D9A441" size="small" />
        </div>

        <div className="paper-modal-section" style={{ marginBottom: 0 }}>
          <p className="paper-modal-label">Abstract</p>
          <p className="paper-modal-abstract">
            {paper.abstract ||
              'Bài báo này chưa có abstract công khai trên OpenAlex (thường do nhà xuất bản không cho phép chỉ mục).'}
          </p>
        </div>
      </div>

      <div className="paper-modal-footer">
        <a
          className="paper-modal-link"
          href={paper.doi ? `https://doi.org/${paper.doi}` : openAlexUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={14} /> {paper.doi ? 'Mở DOI' : 'Mở OpenAlex'}
        </a>
      </div>
    </Modal>
  )
}
