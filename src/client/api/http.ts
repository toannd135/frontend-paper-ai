/**
 * Lớp gọi API dùng chung: prefix /api (Vite proxy -> FastAPI), đọc `detail` từ FastAPI khi lỗi,
 * chuẩn hoá lỗi mạng thành thông điệp tiếng Việt. Mỗi module API truyền class lỗi riêng để
 * caller phân biệt được nguồn lỗi bằng instanceof.
 */

export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

import { getToken, notifyUnauthorized } from '../../auth/tokenStore'

type ErrorCtor = new (message: string, status?: number) => ApiError

const OFFLINE_MESSAGE = 'Không thể kết nối tới máy chủ paperai (kiểm tra backend đã chạy chưa).'

async function readDetail(response: Response): Promise<string | null> {
  try {
    const body = (await response.clone().json()) as { detail?: unknown }
    if (typeof body?.detail === 'string') return body.detail
    if (Array.isArray(body?.detail)) {
      // Lỗi validate 422 của FastAPI: [{loc, msg, type}]
      const msgs = body.detail
        .map((d) => (d && typeof d === 'object' && 'msg' in d ? String((d as { msg: unknown }).msg) : null))
        .filter(Boolean)
      if (msgs.length) return msgs.join('; ')
    }
  } catch {
    // body không phải JSON
  }
  return null
}

export interface RequestOptions extends RequestInit {
  /** Map status -> thông điệp thân thiện, ghi đè `detail` từ server. */
  statusMessages?: Record<number, string>
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}, ErrorClass: ErrorCtor = ApiError): Promise<T> {
  const { statusMessages, ...init } = options
  let response: Response
  const token = getToken()
  const headers = new Headers(init.headers)
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
  try {
    response = await fetch(`/api${path}`, { ...init, headers })
  } catch {
    throw new ErrorClass(OFFLINE_MESSAGE, 0)
  }

  if (response.status === 401 && token && !path.startsWith('/auth/login')) {
    // Token hết hạn/không còn hợp lệ: đăng xuất để quay về trang đăng nhập.
    notifyUnauthorized()
  }

  if (!response.ok) {
    const friendly = statusMessages?.[response.status]
    const detail = friendly ?? (await readDetail(response)) ?? `paperai API trả lỗi (${response.status}).`
    throw new ErrorClass(detail, response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export function postJson<T>(path: string, body: unknown, ErrorClass?: ErrorCtor, statusMessages?: Record<number, string>) {
  return apiFetch<T>(
    path,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), statusMessages },
    ErrorClass,
  )
}

export function toQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') search.set(k, String(v))
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}
