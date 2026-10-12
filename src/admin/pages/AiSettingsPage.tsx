import { useEffect, useState } from 'react'
import { Form, Slider, InputNumber, Input, Button, Tag, App as AntApp, Alert } from 'antd'
import PageHeader from '../components/PageHeader'
import UnimplementedBanner from '../components/UnimplementedBanner'
import { fetchChatModels, type ChatModel } from '../../client/api/chat'

export default function AiSettingsPage() {
  const { message } = AntApp.useApp()
  const [form] = Form.useForm()
  const [models, setModels] = useState<ChatModel[] | null>(null)
  const [modelsError, setModelsError] = useState<string | null>(null)

  useEffect(() => {
    fetchChatModels()
      .then(setModels)
      .catch((err) => setModelsError(err instanceof Error ? err.message : 'Không tải được danh sách model.'))
  }, [])

  return (
    <div>
      <PageHeader
        title="Cấu hình AI & Retrieval"
        description="Các tham số ánh xạ tới app/core/config.py (Settings), điều khiển pipeline embedding / retrieval / generation."
      />

      <div className="admin-card" style={{ maxWidth: 720, marginBottom: 16 }}>
        <p className="admin-card-title">LLM providers (thật, từ GET /chat/models)</p>
        {modelsError && <Alert type="warning" showIcon message={modelsError} style={{ marginBottom: 12 }} />}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(models ?? []).map((m) => (
            <Tag key={m.id} color={m.available ? 'success' : 'default'} style={{ padding: '4px 10px', fontSize: 12.5 }}>
              {m.label} · {m.available ? 'đã có API key' : 'thiếu API key'}
            </Tag>
          ))}
          {models && models.length === 0 && <span style={{ fontSize: 12.5 }}>Backend không khai báo model nào.</span>}
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 10, marginBottom: 0 }}>
          Research agent chọn provider theo <code>AGENT_PROVIDER</code>, nếu trống thì lấy provider đầu tiên có key
          (openrouter → groq → gemini → anthropic → openai). Đổi provider bằng cách sửa <code>.env</code> rồi khởi động lại API và worker.
        </p>
      </div>

      <UnimplementedBanner>
        Form bên dưới hiển thị giá trị mặc định của <code>Settings</code>. Backend chưa có{' '}
        <code>PATCH /admin/settings</code> nên nút Lưu chỉ mô phỏng — thay đổi thật phải sửa <code>.env</code>.
      </UnimplementedBanner>

      <div className="admin-card" style={{ maxWidth: 720 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            embeddingModel: 'BAAI/bge-m3',
            rerankerModel: 'BAAI/bge-reranker-v2-m3',
            hybridAlpha: 0.7,
            hybridBeta: 0.3,
            contextTokenLimit: 8000,
            qdrantCollection: 'paper_chunks',
          }}
          onValuesChange={(changed) => {
            if (typeof changed.hybridAlpha === 'number') {
              form.setFieldValue('hybridBeta', Math.round((1 - changed.hybridAlpha) * 100) / 100)
            }
          }}
          onFinish={() => message.info('Mô phỏng: backend chưa có endpoint ghi cấu hình. Hãy sửa .env.')}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="Embedding model" name="embeddingModel" tooltip="EMBEDDING_MODEL">
              <Input />
            </Form.Item>
            <Form.Item label="Reranker model" name="rerankerModel" tooltip="RERANKER_MODEL">
              <Input />
            </Form.Item>
          </div>

          <Form.Item label="Hybrid retrieval weight — vector (α) / BM25 (β = 1 − α)" tooltip="HYBRID_ALPHA / HYBRID_BETA">
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
