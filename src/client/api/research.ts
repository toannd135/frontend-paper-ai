import type { Citation, ResearchStatus } from '../../types'

interface ApiCitation {
  paper_id: string
  chunk_id: string
  page: number | null
  section: string | null
  text_snippet: string
}

interface ApiResearchClarification {
  status: 'needs_clarification'
  questions: string[]
}

interface ApiResearchTask {
  id: string
  status: ResearchStatus
  report: string | null
  citations: ApiCitation[]
  error: string | null
  created_at: string
}

export type CreateResearchResult =
  | { kind: 'clarification'; questions: string[] }
  | { kind: 'task'; task: ResearchTask }

export interface ResearchTask {
  id: string
  status: ResearchStatus
  report: string | null
  citations: Citation[]
  error: string | null
}

export class ResearchError extends Error {}

function mapCitation(c: ApiCitation): Citation {
  return {
    paperId: c.paper_id,
    chunkId: c.chunk_id,
    page: c.page,
    section: c.section,
    textSnippet: c.text_snippet,
  }
}

function mapTask(t: ApiResearchTask): ResearchTask {
  return {
    id: t.id,
    status: t.status,
    report: t.report,
    citations: t.citations.map(mapCitation),
    error: t.error,
  }
}

async function postResearch(body: {
  question: string
  clarification_answers?: Record<string, string>
}): Promise<CreateResearchResult> {
  let response: Response
  try {
    response = await fetch('/api/research/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ResearchError('Không thể kết nối tới máy chủ paperai (kiểm tra backend đã chạy chưa).')
  }

  if (!response.ok) {
    throw new ResearchError(`paperai API trả lỗi (${response.status}).`)
  }

  const data = (await response.json()) as ApiResearchClarification | ApiResearchTask
  if (data.status === 'needs_clarification') {
    return { kind: 'clarification', questions: data.questions }
  }
  return { kind: 'task', task: mapTask(data as ApiResearchTask) }
}

export function createResearch(question: string): Promise<CreateResearchResult> {
  return postResearch({ question })
}

export function answerClarification(
  question: string,
  clarificationAnswers: Record<string, string>,
): Promise<CreateResearchResult> {
  return postResearch({ question, clarification_answers: clarificationAnswers })
}

export async function getResearchTask(id: string): Promise<ResearchTask> {
  let response: Response
  try {
    response = await fetch(`/api/research/${id}`)
  } catch {
    throw new ResearchError('Không thể kết nối tới máy chủ paperai (kiểm tra backend đã chạy chưa).')
  }

  if (!response.ok) {
    throw new ResearchError(`paperai API trả lỗi (${response.status}).`)
  }

  const data = (await response.json()) as ApiResearchTask
  return mapTask(data)
}
