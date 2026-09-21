import { Table, Progress, Tag } from 'antd'
import PageHeader from '../components/PageHeader'
import UnimplementedBanner from '../components/UnimplementedBanner'
import { adminResearchJobs, researchJobStages, type AdminResearchJob, type ResearchJobStage } from '../data/mockAdmin'

function StagePipeline({ stage }: { stage: ResearchJobStage }) {
  if (stage === 'failed') return <Tag color="error">Failed</Tag>
  const currentIndex = stage === 'done' ? researchJobStages.length : researchJobStages.findIndex((s) => s.key === stage)
  return (
    <div className="stage-pipeline">
      {researchJobStages.map((s, i) => (
        <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span className={`stage-pill${i < currentIndex ? ' done' : i === currentIndex ? ' active' : ''}`}>
            {s.label}
          </span>
          {i < researchJobStages.length - 1 && <span className="stage-arrow">→</span>}
        </span>
      ))}
    </div>
  )
}

export default function ResearchJobsPage() {
  return (
    <div>
      <PageHeader
        title="Research Jobs"
        description="Theo dõi các phiên nghiên cứu tự động (topic → plan → search → analyze → synthesize → critique) do LangGraph agent thực thi."
      />

      <UnimplementedBanner>
        Toàn bộ pipeline research agent (<code>app/agent/graph.py</code> và 5 node <code>plan/search/analyze/
        synthesize/critique</code>) hiện là stub rỗng trong backend — chưa có job nào chạy thật. Dữ liệu dưới đây là{' '}
        <strong>mock</strong> minh hoạ information architecture cho màn hình này khi agent được triển khai.
      </UnimplementedBanner>

      <div className="admin-card">
        <Table
          rowKey="id"
          dataSource={adminResearchJobs}
          pagination={false}
          columns={[
            {
              title: 'Chủ đề',
              dataIndex: 'topic',
              render: (v: string, r: AdminResearchJob) => (
                <div>
                  <p style={{ margin: 0, fontWeight: 500 }}>{v}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--color-ink-muted)' }}>{r.requestedBy}</p>
                </div>
              ),
            },
            {
              title: 'Pipeline',
              dataIndex: 'stage',
              width: 380,
              render: (stage: ResearchJobStage) => <StagePipeline stage={stage} />,
            },
            {
              title: 'Tiến độ',
              dataIndex: 'progress',
              width: 140,
              render: (v: number, r: AdminResearchJob) => (
                <Progress
                  percent={v}
                  size="small"
                  status={r.stage === 'failed' ? 'exception' : v === 100 ? 'success' : 'active'}
                  strokeColor={r.stage === 'failed' ? undefined : '#D9A441'}
                />
              ),
            },
            { title: 'Nguồn tìm được', dataIndex: 'sourcesFound', width: 110 },
            {
              title: 'Bắt đầu lúc',
              dataIndex: 'startedAt',
              width: 150,
              render: (v: string) => new Date(v).toLocaleString('vi-VN'),
            },
          ]}
        />
      </div>
    </div>
  )
}
