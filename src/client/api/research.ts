import type { ClarificationQuestionSpec, Citation, ResearchStatus } from '../../types'
import { mapCitation, type ApiCitation } from './chat'
import { ApiError, apiFetch, postJson, toQuery } from './http'

interface ApiResearchClarification {
  status: 'needs_clarification'
  questions: ClarificationQuestionSpec[]
}

interface ApiResearchTask {
  id: string
  question: string
  refined_question: string | null
  status: ResearchStatus
  report: string | null
  citations: ApiCitation[]
  error: string | null
  created_at: string
}

interface ApiResearchSummary {
  id: string
  question: string
  refined_question: string | null
  status: ResearchStatus
  has_report: boolean
  citation_count: number
  error: string | null
  created_at: string
}

export interface ResearchTask {
  id: string
  question: string
  refinedQuestion: string | null
  status: ResearchStatus
  report: string | null
  citations: Citation[]
  error: string | null
  createdAt: string
}

export interface ResearchSummary {
  id: string
  question: string
  refinedQuestion: string | null
  status: ResearchStatus
  hasReport: boolean
  citationCount: number
  error: string | null
  createdAt: string
}

export type CreateResearchResult =
  | { kind: 'clarification'; questions: ClarificationQuestionSpec[] }
  | { kind: 'task'; task: ResearchTask }

export class ResearchError extends ApiError {}

function mapTask(t: ApiResearchTask): ResearchTask {
  return {
    id: t.id,
    question: t.question,
    refinedQuestion: t.refined_question,
    status: t.status,
    report: t.report,
    citations: (t.citations ?? []).map(mapCitation),
    error: t.error,
    createdAt: t.created_at,
  }
}

function mapSummary(t: ApiResearchSummary): ResearchSummary {
  return {
    id: t.id,
    question: t.question,
    refinedQuestion: t.refined_question,
    status: t.status,
    hasReport: t.has_report,
    citationCount: t.citation_count,
    error: t.error,
    createdAt: t.created_at,
  }
}

async function postResearch(body: { question: string; clarification_answers?: Record<string, string> }) {
  const data = await postJson<ApiResearchClarification | ApiResearchTask>('/research/', body, ResearchError, {
    503: 'Dịch vụ LLM đang quá tải hoặc chưa cấu hình API key. Thử lại sau ít phút.',
  })
  if (data.status === 'needs_clarification') {
    return { kind: 'clarification', questions: data.questions } satisfies CreateResearchResult
  }
  return { kind: 'task', task: mapTask(data as ApiResearchTask) } satisfies CreateResearchResult
}

export function createResearch(question: string): Promise<CreateResearchResult> {
  return postResearch({ question })
}

export function answerClarification(question: string, clarificationAnswers: Record<string, string>) {
  return postResearch({ question, clarification_answers: clarificationAnswers })
}

export async function getResearchTask(id: string): Promise<ResearchTask> {
  return mapTask(await apiFetch<ApiResearchTask>(`/research/${id}`, {}, ResearchError))
}

export async function listResearchTasks(
  params: { limit?: number; offset?: number; status?: ResearchStatus | null } = {},
): Promise<{ items: ResearchSummary[]; total: number }> {
  const query = toQuery({
    limit: params.limit ?? 50,
    offset: params.offset ?? 0,
    status: params.status ?? null,
  })
  const data = await apiFetch<{ items: ApiResearchSummary[]; total: number }>(`/research${query}`, {}, ResearchError)
  return { items: data.items.map(mapSummary), total: data.total }
}

export function deleteResearchTask(id: string): Promise<void> {
  return apiFetch<void>(`/research/${id}`, { method: 'DELETE' }, ResearchError)
}

/** URL mở PDF báo cáo (backend render Typst, fallback HTML). */
export function researchPdfUrl(id: string, options: { engine?: 'typst' | 'html'; download?: boolean } = {}): string {
  return `/api/research/${id}/pdf${toQuery({ engine: options.engine ?? 'typst', download: options.download ? 'true' : null })}`
}
