import type { Citation } from '../../types'

interface ApiCitation {
  paper_id: string
  chunk_id: string
  page: number | null
  section: string | null
  text_snippet: string
}

interface ApiChatResponse {
  conversation_id: string
  answer: string
  citations: ApiCitation[]
  model: string
}

export interface ChatResult {
  conversationId: string
  answer: string
  citations: Citation[]
  model: string
}

export interface ChatModel {
  id: string
  label: string
  available: boolean
}

export class ChatError extends Error {}

export async function fetchChatModels(): Promise<ChatModel[]> {
  let response: Response
  try {
    response = await fetch('/api/chat/models')
  } catch {
    throw new ChatError('Không thể kết nối tới máy chủ paperai (kiểm tra backend đã chạy chưa).')
  }
  if (!response.ok) {
    throw new ChatError(`paperai API trả lỗi (${response.status}).`)
  }
  return (await response.json()) as ChatModel[]
}

export async function sendChat(
  question: string,
  options: { paperId?: string | null; conversationId?: string | null; model?: string | null } = {},
): Promise<ChatResult> {
  let response: Response
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        paper_id: options.paperId ?? null,
        conversation_id: options.conversationId ?? null,
        model: options.model ?? null,
      }),
    })
  } catch {
    throw new ChatError('Không thể kết nối tới máy chủ paperai (kiểm tra backend đã chạy chưa).')
  }

  if (response.status === 404) {
    throw new ChatError('Không tìm thấy nội dung liên quan trong tài liệu để trả lời.')
  }
  if (!response.ok) {
    throw new ChatError(`paperai API trả lỗi (${response.status}).`)
  }

  const data = (await response.json()) as ApiChatResponse
  return {
    conversationId: data.conversation_id,
    answer: data.answer,
    citations: data.citations.map((c) => ({
      paperId: c.paper_id,
      chunkId: c.chunk_id,
      page: c.page,
      section: c.section,
      textSnippet: c.text_snippet,
    })),
    model: data.model,
  }
}
