import type { PaperStatus } from '../../types'

interface ApiPaperUploadResponse {
  id: string
  filename: string
  status: PaperStatus
}

interface ApiPaperStatusResponse {
  id: string
  filename: string
  status: PaperStatus
  error: string | null
  created_at: string
}

export interface PaperInfo {
  id: string
  filename: string
  status: PaperStatus
  error: string | null
}

export class PaperUploadError extends Error {}

export async function uploadPaper(file: File): Promise<PaperInfo> {
  const form = new FormData()
  form.append('file', file)

  let response: Response
  try {
    response = await fetch('/api/papers/upload', { method: 'POST', body: form })
  } catch {
    throw new PaperUploadError('Không thể kết nối tới máy chủ paperai (kiểm tra backend đã chạy chưa).')
  }

  if (!response.ok) {
    let detail = `paperai API trả lỗi (${response.status}).`
    try {
      const body = (await response.json()) as { detail?: string }
      if (body?.detail) detail = body.detail
    } catch {
      // ignore
    }
    throw new PaperUploadError(detail)
  }

  const data = (await response.json()) as ApiPaperUploadResponse
  return { id: data.id, filename: data.filename, status: data.status, error: null }
}

export async function getPaper(id: string): Promise<PaperInfo> {
  let response: Response
  try {
    response = await fetch(`/api/papers/${id}`)
  } catch {
    throw new PaperUploadError('Không thể kết nối tới máy chủ paperai (kiểm tra backend đã chạy chưa).')
  }

  if (!response.ok) {
    throw new PaperUploadError(`paperai API trả lỗi (${response.status}).`)
  }

  const data = (await response.json()) as ApiPaperStatusResponse
  return { id: data.id, filename: data.filename, status: data.status, error: data.error }
}
