import { Form, Select, Slider, InputNumber, Input, Button, Tag, App as AntApp } from 'antd'
import PageHeader from '../components/PageHeader'
import UnimplementedBanner from '../components/UnimplementedBanner'

const PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini (gemini-2.5-flash)', status: 'active' },
  { value: 'anthropic', label: 'Anthropic Claude', status: 'stub' },
  { value: 'openai', label: 'OpenAI', status: 'stub' },
  { value: 'vllm', label: 'Self-hosted vLLM', status: 'stub' },
]

export default function AiSettingsPage() {
  const { message } = AntApp.useApp()
  const [form] = Form.useForm()

  return (
    <div>
      <PageHeader
        title="Cấu hình AI & Retrieval"
        description="Các tham số này ánh xạ trực tiếp tới app/core/config.py (biến môi trường Settings) đang điều khiển pipeline embedding/retrieval/generation."
      />

      <UnimplementedBanner>
        Đây là trang cấu hình <strong>thật nhất</strong> trong CMS này — mọi trường bên dưới đều tương ứng 1-1 với
        biến trong <code>.env</code> / <code>Settings</code>. Cần thêm <code>PATCH /admin/settings/ai</code> ở
        backend (hiện chưa có) để form này ghi thay đổi thật; hiện tại Lưu chỉ mô phỏng phía client.
      </UnimplementedBanner>

      <div className="admin-card" style={{ maxWidth: 720 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            provider: 'gemini',
            embeddingModel: 'BAAI/bge-m3',
            rerankerModel: 'BAAI/bge-reranker-v2-m3',
            hybridAlpha: 0.7,
            hybridBeta: 0.3,
            contextTokenLimit: 8000,
            qdrantCollection: 'paper_chunks',
          }}
          onFinish={() => message.success('Đã lưu cấu hình (mô phỏng — chưa có endpoint PATCH thật)')}
        >
          <Form.Item label="LLM Provider" name="provider" tooltip="GEMINI_API_KEY trong .env">
            <Select
              options={PROVIDERS.map((p) => ({
                value: p.value,
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {p.label}
                    <Tag color={p.status === 'active' ? 'success' : 'default'} style={{ marginLeft: 8 }}>
                      {p.status === 'active' ? 'Đang dùng' : 'Chưa triển khai'}
                    </Tag>
                  </span>
                ),
              }))}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="Embedding model" name="embeddingModel" tooltip="EMBEDDING_MODEL">
              <Input />
            </Form.Item>
            <Form.Item label="Reranker model" name="rerankerModel" tooltip="RERANKER_MODEL">
              <Input />
            </Form.Item>
          </div>

          <Form.Item label="Hybrid retrieval weight — vector (α) / BM25 (β)" tooltip="HYBRID_ALPHA / HYBRID_BETA">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Form.Item name="hybridAlpha" noStyle>
                <Slider min={0} max={1} step={0.05} style={{ flex: 1 }} />
              </Form.Item>
              <Form.Item name="hybridBeta" noStyle>
                <InputNumber min={0} max={1} step={0.05} style={{ width: 80 }} disabled />
              </Form.Item>
            </div>
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="Context token limit" name="contextTokenLimit" tooltip="CONTEXT_TOKEN_LIMIT">
              <InputNumber min={1000} max={32000} step={500} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Qdrant collection" name="qdrantCollection" tooltip="QDRANT_COLLECTION">
              <Input />
            </Form.Item>
          </div>

          <Button type="primary" htmlType="submit">
            Lưu cấu hình
          </Button>
        </Form>
      </div>
    </div>
  )
}
