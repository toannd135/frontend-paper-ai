import { Table, Tag } from 'antd'
import PageHeader from '../components/PageHeader'
import UnimplementedBanner from '../components/UnimplementedBanner'
import { auditLogs } from '../data/mockAdmin'

export default function AuditLogsPage() {
  return (
    <div>
      <PageHeader title="Audit logs" description="Nhật ký các hành động quan trọng trong hệ thống và của quản trị viên." />

      <UnimplementedBanner>
        Chưa có bảng audit log hay middleware ghi log request nào trong backend hiện tại (chỉ có access log mặc
        định của uvicorn). Cần bổ sung bảng <code>audit_log</code> + middleware ghi log cho các hành động
        upload/xoá/đổi cấu hình/đổi quyền.
      </UnimplementedBanner>

      <div className="admin-card">
        <Table
          rowKey="id"
          dataSource={auditLogs}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: 'Người thực hiện', dataIndex: 'actor', width: 220 },
            { title: 'Hành động', dataIndex: 'action', width: 180 },
            { title: 'Đối tượng', dataIndex: 'target' },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
              width: 110,
              render: (s: string) => <Tag color={s === 'success' ? 'success' : 'error'}>{s}</Tag>,
            },
            {
              title: 'Thời gian',
              dataIndex: 'at',
              width: 170,
              render: (v: string) => new Date(v).toLocaleString('vi-VN'),
            },
          ]}
        />
      </div>
    </div>
  )
}
