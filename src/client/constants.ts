import type { ResearchAudience, ResearchField, ResearchVenue } from '../types'

/** Các bước hiển thị trong ProgressCard khi research agent đang chạy phía backend.
 *  Backend không stream tiến độ theo bước; card tiến dần theo mỗi lần poll trạng thái và
 *  chỉ đánh dấu hoàn tất khi task thật sự `done`. */
export const researchingSteps: string[] = [
  'Lập kế hoạch truy vấn',
  'Tìm kiếm kho nội bộ & OpenAlex',
  'Phân tích bằng chứng',
  'Tự phản biện trích dẫn',
  'Tổng hợp báo cáo',
  'Kiểm tra định dạng',
]

/** Bước tìm kiếm khi nghiên cứu chỉ trên PDF người dùng tải lên. */
export const uploadedResearchingSteps: string[] = researchingSteps.map((step, i) =>
  i === 1 ? 'Tìm kiếm trong PDF đã tải lên' : step,
)

export const topicSuggestions: string[] = [
  'Ứng dụng RAG trong giáo dục',
  'AI trong phát hiện gian lận',
  'Ứng dụng LLM trong chăm sóc khách hàng',
  'Kiến trúc Microservices',
]

export const audienceOptions: { value: ResearchAudience; label: string }[] = [
  { value: 'lecturer', label: 'Giảng viên / Nhà nghiên cứu' },
  { value: 'student', label: 'Sinh viên' },
  { value: 'professional', label: 'Người đi làm' },
]

export const fieldOptions: { value: ResearchField; label: string }[] = [
  { value: '', label: 'Tự động nhận diện' },
  { value: 'computing', label: 'Khoa học máy tính & AI' },
  { value: 'computer_vision', label: 'Xử lý ảnh & Thị giác máy tính' },
  { value: 'environment', label: 'Môi trường' },
  { value: 'medicine', label: 'Y tế' },
  { value: 'economics', label: 'Kinh tế' },
  { value: 'education', label: 'Giáo dục' },
]

/** Nơi nộp bài: quyết định độ dài, mục bắt buộc (Limitations, IMRaD), ẩn danh và template LaTeX khi xuất. */
export const venueOptions: { value: ResearchVenue; label: string }[] = [
  { value: '', label: 'Không chọn nơi nộp' },
  { value: 'ieee', label: 'IEEE (IEEEtran)' },
  { value: 'cvpr', label: 'CVPR / ICCV' },
  { value: 'neurips', label: 'NeurIPS / ICLR' },
  { value: 'acl', label: 'ACL / EMNLP' },
  { value: 'acm', label: 'ACM (acmart)' },
  { value: 'elsevier', label: 'Elsevier (elsarticle)' },
  { value: 'medical', label: 'Y sinh (IMRaD)' },
]
