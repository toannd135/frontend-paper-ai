// Bỏ phần mở đầu mang tính ra lệnh để tên phiên nghiên cứu ngắn, dễ nhận ra.
const LEADING_NOISE = [
  /^(hãy|xin|vui lòng|làm ơn)\s+/i,
  /^(viết|soạn|tạo|làm|chuyển|dịch)\s+(cho tôi\s+)?(một\s+)?(bài\s+báo(\s+khoa\s+học)?|bài\s+nghiên\s+cứu|báo\s+cáo|câu\s+này|nội\s+dung\s+này)?\s*/i,
  /^(về|cho|với)?\s*(lĩnh\s+vực|chủ\s+đề|đề\s+tài|vấn\s+đề)\s+/i,
  /^(về|cho)\s+/i,
  /^(sang\s+)?tiếng\s+(anh|việt)[\s,:.-]*/i,
]

export function shortTitle(text: string, max = 34): string {
  let t = text.replace(/\s+/g, ' ').trim()
  for (let pass = 0; pass < 3; pass += 1) {
    const before = t
    for (const re of LEADING_NOISE) t = t.replace(re, '')
    if (t === before) break
  }
  if (t.length < 4) t = text.replace(/\s+/g, ' ').trim()
  t = t.charAt(0).toUpperCase() + t.slice(1)
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:-]+$/, '') + '…'
}
