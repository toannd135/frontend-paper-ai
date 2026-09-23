import type { Conversation, ResearchQuestion, ResearchSourceRaw, SourceRelation } from '../types'

export const mockConversations: Record<string, Conversation[]> = {
  'Hôm nay': [
    { id: 'c1', title: 'RAG trong giáo dục' },
    { id: 'c2', title: 'AI trong y tế' },
    { id: 'c3', title: 'IoT Smart Home' },
  ],
  'Hôm qua': [
    { id: 'c4', title: 'Kubernetes trong triển khai AI' },
    { id: 'c5', title: 'Large Language Model' },
  ],
  '7 ngày qua': [
    { id: 'c6', title: 'Computer Vision' },
    { id: 'c7', title: 'AI Agent tự động hoá' },
  ],
}

export const questions: ResearchQuestion[] = [
  {
    id: 'focus',
    prompt: 'Bạn muốn bài báo tập trung vào khía cạnh nào?',
    options: ['Kiến trúc hệ thống', 'Đánh giá hiệu năng', 'So sánh RAG và LLM', 'Ứng dụng thực tế'],
  },
  {
    id: 'years',
    prompt: 'Bạn muốn sử dụng tài liệu trong khoảng thời gian nào?',
    options: ['Tất cả', '2022', '2023', '2024', '2025', '2026'],
  },
  {
    id: 'length',
    prompt: 'Bạn muốn bài báo dài khoảng bao nhiêu?',
    options: ['5 trang', '10 trang', '15 trang', '20+ trang'],
  },
]

export const researchingSteps: string[] = [
  'Phân tích chủ đề',
  'Xây dựng từ khóa',
  'Tìm kiếm nguồn học thuật',
  'Đang phân tích bài báo',
  'Xếp hạng nguồn',
  'Chuẩn bị tổng hợp',
]

export const generatingSteps: string[] = [
  'Phân tích nguồn',
  'Xây dựng outline',
  'Tổng hợp literature review',
  'Viết nội dung',
  'Kiểm tra citation',
  'Hoàn thiện bài báo',
]

export const mockPapersRaw: ResearchSourceRaw[] = [
  { title: 'Retrieval-Augmented Generation: A Comprehensive Survey', authors: 'Lewis, P. et al.', year: 2024, publisher: 'arXiv', type: 'Preprint', doi: '10.48550/arXiv.2312.10997', relevance: 94, citations: 812 },
  { title: 'Retrieval Augmented Generation for Knowledge-Intensive NLP Tasks', authors: 'Guu, K., Lee, K. et al.', year: 2023, publisher: 'ACM', type: 'Conference Paper', doi: '10.1145/3543872', relevance: 91, citations: 1204 },
  { title: 'LLM-based Customer Service Automation: A Framework', authors: 'Chen, Y., Park, S.', year: 2025, publisher: 'IEEE', type: 'Journal Article', doi: '10.1109/TSC.2025.331021', relevance: 88, citations: 156 },
  { title: 'Evaluating Response Quality in RAG-based Chatbots', authors: 'Nguyen, T., Tran, M.', year: 2024, publisher: 'Springer', type: 'Journal Article', doi: '10.1007/s10796-024-10432-1', relevance: 86, citations: 94 },
  { title: 'Hybrid Retrieval Strategies for Enterprise Support Systems', authors: 'Alvarez, D. et al.', year: 2023, publisher: 'ACL Anthology', type: 'Conference Paper', doi: '10.18653/v1/2023.acl-long.221', relevance: 83, citations: 210 },
  { title: 'Vector Databases and Semantic Search: A Practical Guide', authors: 'Okafor, C., Wright, B.', year: 2022, publisher: 'arXiv', type: 'Preprint', doi: '10.48550/arXiv.2210.09955', relevance: 79, citations: 341 },
  { title: 'Customer Experience Impact of Conversational AI in E-commerce', authors: 'Kim, J., Silva, R.', year: 2024, publisher: 'Elsevier', type: 'Journal Article', doi: '10.1016/j.eswa.2024.121897', relevance: 77, citations: 63 },
  { title: 'Fine-tuning vs. Retrieval Augmentation for Domain Adaptation', authors: 'Popescu, A. et al.', year: 2023, publisher: 'NeurIPS', type: 'Conference Paper', doi: '10.5555/neurips.2023.5521', relevance: 75, citations: 288 },
  { title: 'Latency and Cost Trade-offs in Production RAG Pipelines', authors: 'Zhang, L., Osei, K.', year: 2025, publisher: 'IEEE', type: 'Journal Article', doi: '10.1109/ACCESS.2025.545011', relevance: 72, citations: 41 },
  { title: 'A Taxonomy of Grounding Techniques for Large Language Models', authors: 'Fischer, M., Haddad, R.', year: 2022, publisher: 'ACM', type: 'Survey', doi: '10.1145/3555810', relevance: 68, citations: 402 },
  { title: 'User Trust in AI-Driven Customer Support: An Empirical Study', authors: 'Dubois, E., Kwan, H.', year: 2024, publisher: 'Springer', type: 'Journal Article', doi: '10.1007/s11257-024-09378-2', relevance: 65, citations: 37 },
  { title: 'Multi-hop Reasoning with Retrieval-Augmented Transformers', authors: 'Rahman, S. et al.', year: 2023, publisher: 'arXiv', type: 'Preprint', doi: '10.48550/arXiv.2305.13412', relevance: 61, citations: 175 },
]

// p0..p11 khớp id sinh tự động trong useAppController.ts ('p' + index trong mockPapersRaw).
// 'cites': nguồn mới hơn trích dẫn nguồn nền tảng/cùng-hoặc-trước năm nó.
// 'related': cùng chủ đề nhưng không có quan hệ trích dẫn trực tiếp.
export const mockSourceRelations: SourceRelation[] = [
  { source: 'p0', target: 'p1', kind: 'cites' },
  { source: 'p0', target: 'p5', kind: 'cites' },
  { source: 'p0', target: 'p9', kind: 'cites' },
  { source: 'p0', target: 'p11', kind: 'cites' },
  { source: 'p1', target: 'p5', kind: 'cites' },
  { source: 'p1', target: 'p9', kind: 'related' },
  { source: 'p3', target: 'p1', kind: 'cites' },
  { source: 'p3', target: 'p0', kind: 'related' },
  { source: 'p4', target: 'p1', kind: 'cites' },
  { source: 'p4', target: 'p5', kind: 'cites' },
  { source: 'p7', target: 'p1', kind: 'cites' },
  { source: 'p7', target: 'p9', kind: 'related' },
  { source: 'p11', target: 'p1', kind: 'cites' },
  { source: 'p11', target: 'p9', kind: 'cites' },
  { source: 'p2', target: 'p4', kind: 'cites' },
  { source: 'p2', target: 'p6', kind: 'related' },
  { source: 'p2', target: 'p10', kind: 'cites' },
  { source: 'p6', target: 'p4', kind: 'related' },
  { source: 'p6', target: 'p10', kind: 'related' },
  { source: 'p10', target: 'p4', kind: 'cites' },
  { source: 'p8', target: 'p4', kind: 'related' },
  { source: 'p8', target: 'p0', kind: 'related' },
]

export const aiSummaries: string[] = [
  'Bài báo trình bày một khảo sát toàn diện về kỹ thuật truy xuất kết hợp sinh văn bản, tổng hợp các hướng tiếp cận chính và xu hướng nghiên cứu gần đây.',
  'Nghiên cứu đề xuất phương pháp kết hợp mô hình truy xuất và mô hình ngôn ngữ để cải thiện độ chính xác trên các tác vụ đòi hỏi nhiều tri thức nền.',
  'Tác giả xây dựng một framework ứng dụng LLM vào tự động hoá dịch vụ khách hàng, đánh giá trên dữ liệu thực tế từ doanh nghiệp.',
]

export const keyFindingsPool: string[][] = [
  ['Cải thiện độ chính xác 12-18% so với baseline', 'Giảm hiện tượng "hallucination" đáng kể', 'Chi phí suy luận tăng nhẹ do bước truy xuất'],
  ['Hiệu năng ổn định trên nhiều miền dữ liệu khác nhau', 'Cần tối ưu latency cho môi trường production', 'Chất lượng nguồn truy xuất ảnh hưởng trực tiếp đến đầu ra'],
]

export const methodologyPool: string[] = [
  'Thực nghiệm so sánh trên 5 bộ dữ liệu chuẩn, sử dụng cả đánh giá tự động và đánh giá của con người.',
  'Khảo sát tổng hợp từ hơn 80 công trình nghiên cứu liên quan, phân loại theo kiến trúc và mục tiêu ứng dụng.',
]

export const limitationsPool: string[] = [
  'Chưa đánh giá đầy đủ trên dữ liệu tiếng Việt hoặc ngôn ngữ ít tài nguyên.',
  'Kết quả có thể phụ thuộc vào chất lượng của kho dữ liệu truy xuất được sử dụng.',
]
