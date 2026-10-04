import { Empty } from 'antd'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import UnimplementedBanner from '../components/UnimplementedBanner'

export default function ArticlesPage() {
  return (
    <div>
      <PageHeader
        title="Bài báo"
        description="Quản lý vòng đời bài báo (nháp → duyệt → xuất bản), tách khỏi phiên nghiên cứu sinh ra nó."
      />

      <UnimplementedBanner>
        Backend hiện lưu bài báo như trường <code>report</code> của từng research task (xem{' '}
        <Link to="/admin/research-jobs">Research Jobs</Link>), chưa có entity/route <code>article</code> riêng kèm trạng
        thái xuất bản. Khi cần quy trình biên tập, bổ sung bảng <code>articles</code> và{' '}
        <code>GET/PATCH /articles</code>.
      </UnimplementedBanner>

      <div className="admin-card">
        <Empty description="Chưa có module bài báo độc lập — xem báo cáo trong Research Jobs." />
      </div>
    </div>
  )
}
