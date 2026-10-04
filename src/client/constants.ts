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

export const topicSuggestions: string[] = [
  'Ứng dụng RAG trong giáo dục',
  'AI trong phát hiện gian lận',
  'Ứng dụng LLM trong chăm sóc khách hàng',
  'Kiến trúc Microservices',
]
