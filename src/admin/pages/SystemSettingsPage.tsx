import { Form, Input, Select, Button, Tag, App as AntApp } from 'antd'
import { Database, Boxes, Server, ListTree } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import UnimplementedBanner from '../components/UnimplementedBanner'

const INFRA = [
  { icon: Database, name: 'PostgreSQL', desc: 'DATABASE_URL — papers, conversations, messages', status: 'connected' },
  { icon: Boxes, name: 'Qdrant', desc: 'QDRANT_URL — vector store cho chunk embeddings', status: 'connected' },
  { icon: Server, name: 'Redis', desc: 'REDIS_URL — Celery broker & result backend', status: 'connected' },
  { icon: ListTree, name: 'Celery queues', desc: 'upload_queue, research_queue', status: 'connected' },
]

export default function SystemSettingsPage() {
  const { message } = AntApp.useApp()
  const [form] = Form.useForm()

  return (
    <div>
      <PageHeader
        title="Cấu hình hệ thống"
        description="Thông tin ứng dụng và trạng thái các thành phần hạ tầng (theo docker-compose.yml)."
      />

      <UnimplementedBanner>
        Trạng thái kết nối bên dưới là <strong>mô phỏng</strong> — backend chưa có endpoint health-check chi tiết
        cho từng service (mới chỉ có <code>GET /health</code> trả về trạng thái chung của API).
      </UnimplementedBanner>

      <div className="admin-stat-grid" style={{ marginBottom: 24 }}>
        {INFRA.map((item) => (
          <div className="admin-card" key={item.name}>
            <p className="admin-card-title">
              <item.icon size={16} color="var(--color-primary)" /> {item.name}
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 10 }}>{item.desc}</p>
            <Tag color="success">Connected</Tag>
          </div>
        ))}
      </div>

      <div className="admin-card" style={{ maxWidth: 560 }}>
        <p className="admin-card-title">Thông tin ứng dụng</p>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ appName: 'paperai', env: 'development', logLevel: 'INFO' }}
          onFinish={() => message.success('Đã lưu cấu hình (mô phỏng)')}
        >
          <Form.Item label="Tên ứng dụng" name="appName" tooltip="APP_NAME">
            <Input />
          </Form.Item>
          <Form.Item label="Môi trường" name="env" tooltip="ENV">
            <Select
              options={[
                { value: 'development', label: 'Development' },
                { value: 'staging', label: 'Staging' },
                { value: 'production', label: 'Production' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Log level" name="logLevel" tooltip="LOG_LEVEL">
            <Select
              options={['DEBUG', 'INFO', 'WARNING', 'ERROR'].map((v) => ({ value: v, label: v }))}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Lưu thay đổi
          </Button>
        </Form>
      </div>
    </div>
  )
}
