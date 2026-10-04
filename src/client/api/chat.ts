import type { Citation } from '../../types'
import { ApiError, apiFetch, postJson, toQuery } from './http'

export interface ApiCitation {
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

export interface ConversationSummary {
  id: string
  paperId: string | null
  createdAt: string
  messageCount: number
  lastMessage: string | null
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | string
  content: string
  createdAt: string
}

export interface ConversationDetail {
  id: string
  paperId: string | null
  messages: ConversationMessage[]
}

export class ChatError extends ApiError {}

export function mapCitation(c: ApiCitation): Citation {
  return { paperId: c.paper_id, chunkId: c.chunk_id, page: c.page, section: c.section, textSnippet: c.text_snippet }
}

export function fetchChatModels(): Promise<ChatModel[]> {
  return apiFetch<ChatModel[]>('/chat/models', {}, ChatError)
}

export async function sendChat(
  question: string,
  options: { paperId?: string | null; conversationId?: string | null; model?: string | null } = {},
): Promise<ChatResult> {
  const data = await postJson<ApiChatResponse>(
    '/chat',
    {
      question,
      paper_id: options.paperId ?? null,
      conversation_id: options.conversationId ?? null,
      model: options.model ?? null,
    },
    ChatError,
    { 404: 'Không tìm thấy nội dung liên quan trong tài liệu để trả lời.' },
  )
  return {
    conversationId: data.conversation_id,
    answer: data.answer,
    citations: data.citations.map(mapCitation),
    model: data.model,
  }
}

interface ApiConversationList {
  items: { id: string; paper_id: string | null; created_at: string; message_count: number; last_message: string | null }[]
  total: number
}

export async function listConversations(limit = 50, offset = 0): Promise<{ items: ConversationSummary[]; total: number }> {
  const data = await apiFetch<ApiConversationList>(`/conversations${toQuery({ limit, offset })}`, {}, ChatError)
  return {
    total: data.total,
    items: data.items.map((c) => ({
      id: c.id,
      paperId: c.paper_id,
      createdAt: c.created_at,
      messageCount: c.message_count,
      lastMessage: c.last_message,
    })),
  }
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  const data = await apiFetch<{ id: string; paper_id: string | null; messages: { role: string; content: string; created_at: string }[] }>(
    `/conversations/${id}`,
    {},
    ChatError,
  )
  return {
    id: data.id,
    paperId: data.paper_id,
    messages: data.messages.map((m) => ({ role: m.role, content: m.content, createdAt: m.created_at })),
  }
}
