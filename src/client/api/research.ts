import { getToken } from '../../auth/tokenStore'
import type { ClarificationQuestionSpec, Citation, ProgressLogEntry, ResearchOptions, ResearchStatus } from '../../types'
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
  progress?: ProgressLogEntry[]
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
  progress: ProgressLogEntry[]
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
    progress: t.progress ?? [],
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

/** Body của POST /research/ — `field` bỏ trống thì backend tự nhận diện lĩnh vực. */
interface ResearchRequestBody {
  workspace_id?: string
  question: string
  clarification_answers?: Record<string, string>
  audience: ResearchOptions['audience']
  field?: Exclude<ResearchOptions['field'], ''>
  contribution_type?: Exclude<ResearchOptions['contributionType'], '' | undefined>
  target_venue?: string
  user_results?: string
}

async function postResearch(
  base: { question: string; clarification_answers?: Record<string, string> },
  options: ResearchOptions,
  workspaceId?: string | null,
) {
  const body: ResearchRequestBody = { ...base, audience: options.audience }
  if (workspaceId) body.workspace_id = workspaceId
  if (options.field) body.field = options.field
  if (options.contributionType) body.contribution_type = options.contributionType
  if (options.targetVenue?.trim()) body.target_venue = options.targetVenue.trim()
  if (options.userResults?.trim()) body.user_results = options.userResults.trim()
  const data = await postJson<ApiResearchClarification | ApiResearchTask>('/research/', body, ResearchError, {
    503: 'Dịch vụ LLM đang quá tải hoặc chưa cấu hình API key. Thử lại sau ít phút.',
  })
  if (data.status === 'needs_clarification') {
    return { kind: 'clarification', questions: data.questions } satisfies CreateResearchResult
  }
  return { kind: 'task', task: mapTask(data as ApiResearchTask) } satisfies CreateResearchResult
}

/** `workspaceId`: chỉ dùng PDF của phiên đó, không tìm nguồn ngoài; bỏ trống = thư viện chung + nguồn ngoài. */
export function createResearch(
  question: string,
  options: ResearchOptions,
  workspaceId?: string | null,
): Promise<CreateResearchResult> {
  return postResearch({ question }, options, workspaceId)
}

export function answerClarification(
  question: string,
  clarificationAnswers: Record<string, string>,
  options: ResearchOptions,
  workspaceId?: string | null,
) {
  return postResearch({ question, clarification_answers: clarificationAnswers }, options, workspaceId)
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

export type PdfEngine = 'latex' | 'typst' | 'html'
export type PaperTemplate = 'ieee' | 'cvpr'
export type ExportKind = 'pdf' | 'latex' | 'bib'

export interface ExportOptions {
  engine?: PdfEngine
  template?: PaperTemplate
  /** Bỏ qua chặn Quality Gate (bản nháp). */
  draft?: boolean
}

/** URL xuất báo cáo: pdf (LaTeX IEEEtran mặc định, fallback HTML), latex (zip), bib. */
export function researchExportUrl(id: string, kind: ExportKind, options: ExportOptions = {}): string {
  // Mở bằng tab mới/thẻ <a> nên không gửi được header Authorization: đính token vào query.
  return `/api/research/${id}/${kind}${toQuery({
    engine: kind === 'pdf' ? (options.engine ?? 'latex') : null,
    template: kind === 'bib' ? null : (options.template ?? null),
    draft: options.draft && kind !== 'bib' ? 'true' : null,
    access_token: getToken(),
  })}`
}

export function researchPdfUrl(id: string, options: ExportOptions = {}): string {
  return researchExportUrl(id, 'pdf', options)
}

/**
 * Tải tệp xuất dạng Blob để bắt được lỗi (409 Quality Gate, 404...) thay vì mở tab chỉ hiện JSON lỗi.
 * Lỗi ném ResearchError có `status` + `detail` từ backend.
 */
export async function fetchResearchExport(id: string, kind: ExportKind, options: ExportOptions = {}): Promise<Blob> {
  let response: Response
  try {
    response = await fetch(researchExportUrl(id, kind, options))
  } catch {
    throw new ResearchError('Không thể kết nối tới máy chủ paperai (kiểm tra backend đã chạy chưa).', 0)
  }
  if (!response.ok) {
    let detail = `Không xuất được tệp (${response.status}).`
    try {
      const body = (await response.json()) as { detail?: unknown }
      if (typeof body?.detail === 'string') detail = body.detail
    } catch {
      // body không phải JSON
    }
    throw new ResearchError(detail, response.status)
  }
  return response.blob()
}
