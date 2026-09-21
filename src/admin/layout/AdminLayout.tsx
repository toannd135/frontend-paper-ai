import { useMemo } from 'react'
import { Layout, Menu, Badge, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileStack,
  Workflow,
  Newspaper,
  MessagesSquare,
  Users,
  ShieldCheck,
  Cpu,
  Settings,
  ScrollText,
  ArrowLeftFromLine,
  Bell,
  ChevronDown,
} from 'lucide-react'
import logo from '../../assets/logo.png'
import '../AdminApp.css'

const { Sider, Header, Content } = Layout

type MenuItem = Required<MenuProps>['items'][number]

const items: MenuItem[] = [
  { key: '', icon: <LayoutDashboard size={16} />, label: <Link to="/admin">Tổng quan</Link> },
  {
    key: 'content-group',
    type: 'group',
    label: 'Nội dung nghiên cứu',
    children: [
      { key: 'papers', icon: <FileStack size={16} />, label: <Link to="/admin/papers">Nguồn tài liệu</Link> },
      { key: 'research-jobs', icon: <Workflow size={16} />, label: <Link to="/admin/research-jobs">Research Jobs</Link> },
      { key: 'articles', icon: <Newspaper size={16} />, label: <Link to="/admin/articles">Bài báo</Link> },
      { key: 'conversations', icon: <MessagesSquare size={16} />, label: <Link to="/admin/conversations">Hội thoại</Link> },
    ],
  },
  {
    key: 'people-group',
    type: 'group',
    label: 'Người dùng & phân quyền',
    children: [
      { key: 'users', icon: <Users size={16} />, label: <Link to="/admin/users">Người dùng</Link> },
      { key: 'roles', icon: <ShieldCheck size={16} />, label: <Link to="/admin/roles">Vai trò & quyền</Link> },
    ],
  },
  {
    key: 'system-group',
    type: 'group',
    label: 'Hệ thống',
    children: [
      { key: 'settings/ai', icon: <Cpu size={16} />, label: <Link to="/admin/settings/ai">AI & Retrieval</Link> },
      { key: 'settings/system', icon: <Settings size={16} />, label: <Link to="/admin/settings/system">Cấu hình hệ thống</Link> },
      { key: 'logs', icon: <ScrollText size={16} />, label: <Link to="/admin/logs">Audit logs</Link> },
    ],
  },
]

const PAGE_TITLES: Record<string, string> = {
  '': 'Tổng quan',
  papers: 'Nguồn tài liệu',
  'research-jobs': 'Research Jobs',
  articles: 'Bài báo',
  conversations: 'Hội thoại',
  users: 'Người dùng',
  roles: 'Vai trò & quyền',
  'settings/ai': 'Cấu hình AI & Retrieval',
  'settings/system': 'Cấu hình hệ thống',
  logs: 'Audit logs',
}

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const selectedKey = useMemo(() => {
    const path = location.pathname.replace(/^\/admin\/?/, '')
    return path
  }, [location.pathname])

  const pageTitle = PAGE_TITLES[selectedKey] ?? 'Tổng quan'

  const userMenu: MenuProps['items'] = [
    { key: 'profile', label: 'Hồ sơ của tôi' },
    { key: 'client', label: <Link to="/">Xem trang client</Link> },
    { type: 'divider' },
    { key: 'logout', label: 'Đăng xuất', danger: true },
  ]

  return (
    <Layout className="admin-shell">
      <Sider width={252} className="admin-sider">
        <div className="admin-logo">
          <img src={logo} alt="PaperAI" />
          <div className="admin-logo-text">
            <p>PaperAI Admin</p>
            <p>Back-office CMS</p>
          </div>
        </div>
        <Menu className="admin-menu" mode="inline" selectedKeys={[selectedKey]} items={items} />
        <div className="admin-sider-footer">
          <Link to="/" className="admin-back-link">
            <ArrowLeftFromLine size={15} /> Về trang client
          </Link>
        </div>
      </Sider>

      <Layout className="admin-main">
        <Header className="admin-header">
          <h1 className="admin-header-title">{pageTitle}</h1>
          <div className="admin-header-right">
            <Badge dot>
              <button
                className="icon-btn"
                style={{ color: 'var(--color-ink-muted)' }}
                aria-label="Thông báo"
                onClick={() => navigate('/admin/logs')}
              >
                <Bell size={18} />
              </button>
            </Badge>
            <Dropdown menu={{ items: userMenu }} trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <div className="admin-avatar">NA</div>
                <ChevronDown size={14} color="var(--color-ink-muted)" />
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="admin-content">
          <div className="admin-content-inner">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
