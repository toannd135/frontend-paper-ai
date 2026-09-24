import type { Conversation, ResearchQuestion } from '../types'

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
