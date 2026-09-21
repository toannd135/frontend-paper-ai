// Mock data for the Admin CMS.
// Papers / Conversations shapes mirror the REAL backend models
// (app/api/models/paper.py, conversation.py) so these views are ready to be
// wired to GET /papers/{id}, GET /conversations, GET /conversations/{id}.
// Research Jobs / Articles / Users / Roles have no backend support yet
// (app/agent/*, app/api/routes/{research,users}.py are stubs) — these are
// designed as the target information architecture for when those land.

export type PaperStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface AdminPaper {
  id: string
  filename: string
  status: PaperStatus
  error: string | null
  sizeKb: number
  pages: number
  createdAt: string
}

export const adminPapers: AdminPaper[] = [
  { id: 'a1b2c3', filename: 'rag-survey-2024.pdf', status: 'done', error: null, sizeKb: 2140, pages: 18, createdAt: '2026-09-20T09:14:00Z' },
  { id: 'd4e5f6', filename: 'customer-service-llm-framework.pdf', status: 'done', error: null, sizeKb: 1876, pages: 12, createdAt: '2026-09-20T10:02:00Z' },
  { id: 'g7h8i9', filename: 'hybrid-retrieval-enterprise.pdf', status: 'processing', error: null, sizeKb: 3021, pages: 22, createdAt: '2026-09-21T07:44:00Z' },
  { id: 'j1k2l3', filename: 'vector-db-semantic-search-guide.pdf', status: 'pending', error: null, sizeKb: 987, pages: 9, createdAt: '2026-09-21T08:10:00Z' },
  { id: 'm4n5o6', filename: 'evaluating-rag-chatbots.pdf', status: 'failed', error: 'Không trích xuất được văn bản (file scan, thiếu OCR)', sizeKb: 4520, pages: 15, createdAt: '2026-09-19T15:31:00Z' },
  { id: 'p7q8r9', filename: 'grounding-techniques-taxonomy.pdf', status: 'done', error: null, sizeKb: 1543, pages: 20, createdAt: '2026-09-18T13:20:00Z' },
]

export interface AdminConversation {
  id: string
  paperId: string
  paperTitle: string
  messageCount: number
  lastMessagePreview: string
  createdAt: string
}

export const adminConversations: AdminConversation[] = [
  { id: 'conv_1', paperId: 'a1b2c3', paperTitle: 'rag-survey-2024.pdf', messageCount: 8, lastMessagePreview: 'Kỹ thuật RAG cải thiện độ chính xác khoảng 12-18% so với baseline…', createdAt: '2026-09-21T09:00:00Z' },
  { id: 'conv_2', paperId: 'd4e5f6', paperTitle: 'customer-service-llm-framework.pdf', messageCount: 5, lastMessagePreview: 'Framework này được đánh giá trên dữ liệu thực tế từ doanh nghiệp…', createdAt: '2026-09-21T08:20:00Z' },
  { id: 'conv_3', paperId: 'p7q8r9', paperTitle: 'grounding-techniques-taxonomy.pdf', messageCount: 12, lastMessagePreview: 'Có 4 nhóm kỹ thuật grounding chính được phân loại trong bài báo…', createdAt: '2026-09-20T16:44:00Z' },
  { id: 'conv_4', paperId: 'a1b2c3', paperTitle: 'rag-survey-2024.pdf', messageCount: 3, lastMessagePreview: 'Bài báo khảo sát hơn 80 công trình liên quan đến truy xuất…', createdAt: '2026-09-20T11:05:00Z' },
]

export type ResearchJobStage = 'plan' | 'search' | 'analyze' | 'synthesize' | 'critique' | 'done' | 'failed'

export interface AdminResearchJob {
  id: string
  topic: string
  requestedBy: string
  stage: ResearchJobStage
  progress: number
  sourcesFound: number
  startedAt: string
}

export const researchJobStages: { key: ResearchJobStage; label: string }[] = [
  { key: 'plan', label: 'Plan' },
  { key: 'search', label: 'Search' },
  { key: 'analyze', label: 'Analyze' },
  { key: 'synthesize', label: 'Synthesize' },
  { key: 'critique', label: 'Critique' },
]

export const adminResearchJobs: AdminResearchJob[] = [
  { id: 'job_1', topic: 'Ứng dụng RAG trong hệ thống chăm sóc khách hàng', requestedBy: 'nguyenvana@paperai.dev', stage: 'synthesize', progress: 78, sourcesFound: 12, startedAt: '2026-09-21T10:12:00Z' },
  { id: 'job_2', topic: 'So sánh RAG và fine-tuning cho miền y tế', requestedBy: 'tranthib@paperai.dev', stage: 'search', progress: 34, sourcesFound: 4, startedAt: '2026-09-21T10:40:00Z' },
  { id: 'job_3', topic: 'Kiến trúc Microservices cho hệ thống AI Agent', requestedBy: 'levanc@paperai.dev', stage: 'done', progress: 100, sourcesFound: 15, startedAt: '2026-09-20T08:00:00Z' },
  { id: 'job_4', topic: 'IoT Smart Home bảo mật dữ liệu người dùng', requestedBy: 'phamthid@paperai.dev', stage: 'failed', progress: 20, sourcesFound: 2, startedAt: '2026-09-19T14:22:00Z' },
]

export type ArticleStatus = 'draft' | 'published' | 'archived'

export interface AdminArticle {
  id: string
  title: string
  author: string
  status: ArticleStatus
  sourceCount: number
  wordCount: number
  updatedAt: string
}

export const adminArticles: AdminArticle[] = [
  { id: 'art_1', title: 'Ứng dụng RAG trong hệ thống chăm sóc khách hàng', author: 'Nguyễn Văn A', status: 'published', sourceCount: 8, wordCount: 2140, updatedAt: '2026-09-21T11:00:00Z' },
  { id: 'art_2', title: 'So sánh RAG và LLM thuần trong tác vụ hỏi đáp', author: 'Trần Thị B', status: 'draft', sourceCount: 5, wordCount: 980, updatedAt: '2026-09-20T17:30:00Z' },
  { id: 'art_3', title: 'Kiến trúc Microservices trong triển khai AI Agent', author: 'Lê Văn C', status: 'published', sourceCount: 15, wordCount: 3410, updatedAt: '2026-09-19T09:12:00Z' },
]

export type UserRole = 'admin' | 'editor' | 'researcher' | 'viewer'
export type UserStatus = 'active' | 'invited' | 'suspended'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  papersUploaded: number
  joinedAt: string
}

export const adminUsers: AdminUser[] = [
  { id: 'u1', name: 'Nguyễn Văn A', email: 'nguyenvana@paperai.dev', role: 'admin', status: 'active', papersUploaded: 14, joinedAt: '2026-06-01T00:00:00Z' },
  { id: 'u2', name: 'Trần Thị B', email: 'tranthib@paperai.dev', role: 'researcher', status: 'active', papersUploaded: 6, joinedAt: '2026-07-12T00:00:00Z' },
  { id: 'u3', name: 'Lê Văn C', email: 'levanc@paperai.dev', role: 'editor', status: 'active', papersUploaded: 3, joinedAt: '2026-08-02T00:00:00Z' },
  { id: 'u4', name: 'Phạm Thị D', email: 'phamthid@paperai.dev', role: 'researcher', status: 'suspended', papersUploaded: 1, joinedAt: '2026-08-20T00:00:00Z' },
  { id: 'u5', name: 'Hoàng Minh E', email: 'hoangminhe@paperai.dev', role: 'viewer', status: 'invited', papersUploaded: 0, joinedAt: '2026-09-15T00:00:00Z' },
]

export interface RoleDef {
  key: UserRole
  label: string
  description: string
  permissions: string[]
}

export const roleDefs: RoleDef[] = [
  {
    key: 'admin',
    label: 'Admin',
    description: 'Toàn quyền quản trị hệ thống, người dùng và cấu hình AI.',
    permissions: ['Quản lý người dùng', 'Cấu hình hệ thống & AI', 'Quản lý nội dung', 'Xem audit log'],
  },
  {
    key: 'editor',
    label: 'Editor',
    description: 'Chỉnh sửa và xuất bản bài báo, quản lý nguồn tài liệu.',
    permissions: ['Quản lý nội dung', 'Duyệt/Xuất bản bài báo'],
  },
  {
    key: 'researcher',
    label: 'Researcher',
    description: 'Tải tài liệu, chạy nghiên cứu, tạo bài báo cho riêng mình.',
    permissions: ['Tải tài liệu', 'Chạy nghiên cứu', 'Tạo bài báo'],
  },
  {
    key: 'viewer',
    label: 'Viewer',
    description: 'Chỉ xem, không có quyền chỉnh sửa.',
    permissions: ['Xem nội dung'],
  },
]

export interface AuditLogEntry {
  id: string
  actor: string
  action: string
  target: string
  status: 'success' | 'failed'
  at: string
}

export const auditLogs: AuditLogEntry[] = [
  { id: 'log_1', actor: 'nguyenvana@paperai.dev', action: 'upload_paper', target: 'rag-survey-2024.pdf', status: 'success', at: '2026-09-21T09:14:00Z' },
  { id: 'log_2', actor: 'system', action: 'process_paper', target: 'g7h8i9', status: 'success', at: '2026-09-21T07:45:00Z' },
  { id: 'log_3', actor: 'system', action: 'process_paper', target: 'm4n5o6', status: 'failed', at: '2026-09-19T15:33:00Z' },
  { id: 'log_4', actor: 'levanc@paperai.dev', action: 'update_role', target: 'u4 → suspended', status: 'success', at: '2026-09-18T10:02:00Z' },
  { id: 'log_5', actor: 'nguyenvana@paperai.dev', action: 'update_ai_settings', target: 'HYBRID_ALPHA 0.7 → 0.65', status: 'success', at: '2026-09-17T14:12:00Z' },
]
