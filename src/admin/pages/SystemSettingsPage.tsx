import { useEffect, useState } from 'react'
import { Form, Input, Select, Button, Tag, App as AntApp } from 'antd'
import { Database, Boxes, Server, ListTree } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import UnimplementedBanner from '../components/UnimplementedBanner'

const INFRA = [
  { icon: Database, name: 'PostgreSQL', desc: 'DATABASE_URL — papers, conversations, messages, research_tasks' },
  { icon: Boxes, name: 'Qdrant', desc: 'QDRANT_URL — vector store cho chunk embeddings' },
  { icon: Server, name: 'Redis', desc: 'REDIS_URL — Celery broker, result backend và cache embedding' },
  { icon: ListTree, name: 'Celery queues', desc: 'upload_queue (ingest PDF), research_queue (agent)' },
]

function ApiHealthCard() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'down'>('loading')
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { status: string; version?: string }) => {
        setStatus(d.status === 'ok' ? 'ok' : 'down')
        setVersion(d.version ?? null)
      })
      .catch(() => setStatus('down'))
  }, [])

  return (
    <div className="admin-card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
      <Tag color={status === 'ok' ? 'success' : status === 'down' ? 'error' : 'default'}>
        {status === 'ok' ? 'API online' : status === 'down' ? 'API offline' : 'Đang kiểm tra…'}
      </Tag>
      <span style={{ fontSize: 13 }}>
        <code>GET /api/health</code>
        {version ? ` · phiên bản ${version}` : ''}
      </span>
    </div>
  )
}

export default function SystemSettingsPage() {
  const { message } = AntApp.useApp()
  const [form] = Form.useForm()

  return (
    <div>
      <PageHeader
        title="Cấu hình hệ thống"
        description="Thông tin ứng dụng và các thành phần hạ tầng theo docker-compose.yml."
      />

      <ApiHealthCard />

      <UnimplementedBanner>
        Mô tả từng service bên dưới lấy từ cấu hình, <strong>không phải health-check thật</strong> — backend mới có{' '}
        <code>GET /health</code> cho API (hiển thị ở trên). Kiểm tra sâu Postgres/Qdrant/Redis cần endpoint riêng.
      </UnimplementedBanner>

      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        {INFRA.map((item) => (
          <div className="admin-card" key={item.name}>
            <p className="admin-card-title">
              <item.icon size={16} color="var(--color-primary)" /> {item.name}
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 10 }}>{item.desc}</p>
            <Tag color="default">Cấu hình trong .env</Tag>
          </div>
        ))}
      </div>

      <div className="admin-card" style={{ maxWidth: 560 }}>
        <p className="admin-card-title">Thông tin ứng dụng</p>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ appName: 'paperai', env: 'local', logLevel: 'INFO' }}
          onFinish={() => message.info('Mô phỏng: hãy sửa .env để đổi cấu hình thật.')}
        >
          <Form.Item label="Tên ứng dụng" name="appName" tooltip="APP_NAME">
            <Input />
          </Form.Item>
          <Form.Item label="Môi trường" name="env" tooltip="ENV">
            <Select
              options={[
                { value: 'local', label: 'Local' },
                { value: 'staging', label: 'Staging' },
                { value: 'production', label: 'Production' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Log level" name="logLevel" tooltip="LOG_LEVEL">
            <Select options={['DEBUG', 'INFO', 'WARNING', 'ERROR'].map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Lưu thay đổi
          </Button>
        </Form>
      </div>
    </div>
  )
}
