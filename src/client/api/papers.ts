import type { PaperStatus } from '../../types'
import { ApiError, apiFetch, toQuery } from './http'

interface ApiPaper {
  id: string
  filename: string
  status: PaperStatus
  error?: string | null
  created_at?: string
}

export interface PaperInfo {
  id: string
  filename: string
  status: PaperStatus
  error: string | null
  createdAt: string | null
}

export class PaperUploadError extends ApiError {}

function mapPaper(p: ApiPaper): PaperInfo {
  return { id: p.id, filename: p.filename, status: p.status, error: p.error ?? null, createdAt: p.created_at ?? null }
}

export async function uploadPaper(file: File): Promise<PaperInfo> {
  const form = new FormData()
  form.append('file', file)
  const data = await apiFetch<ApiPaper>('/papers/upload', { method: 'POST', body: form }, PaperUploadError)
  return mapPaper(data)
}

export async function getPaper(id: string): Promise<PaperInfo> {
  return mapPaper(await apiFetch<ApiPaper>(`/papers/${id}`, {}, PaperUploadError))
}

export async function listPapers(
  params: { limit?: number; offset?: number; status?: PaperStatus | null } = {},
): Promise<{ items: PaperInfo[]; total: number }> {
  const data = await apiFetch<{ items: ApiPaper[]; total: number }>(
    `/papers${toQuery({ limit: params.limit ?? 50, offset: params.offset ?? 0, status: params.status ?? null })}`,
    {},
    PaperUploadError,
  )
  return { items: data.items.map(mapPaper), total: data.total }
}

export async function reprocessPaper(id: string): Promise<PaperInfo> {
  return mapPaper(await apiFetch<ApiPaper>(`/papers/${id}/reprocess`, { method: 'POST' }, PaperUploadError))
}

export function deletePaper(id: string): Promise<void> {
  return apiFetch<void>(`/papers/${id}`, { method: 'DELETE' }, PaperUploadError)
}
