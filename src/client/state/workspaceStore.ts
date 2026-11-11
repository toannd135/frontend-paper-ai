import { useSyncExternalStore } from 'react'

/**
 * Phiên (workspace) đang chọn ở client. Để ngoài appReducer vì nó áp cho mọi lượt nghiên cứu/upload kế tiếp,
 * không thuộc một phiên chat cụ thể. Lưu localStorage để giữ lựa chọn khi tải lại trang.
 * null = không chọn phiên: dùng PDF chưa gán phiên + nguồn ngoài (OpenAlex).
 */
const STORAGE_KEY = 'paperai.workspaceId'

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

let current: string | null = readStored()
const listeners = new Set<() => void>()

export function getCurrentWorkspaceId(): string | null {
  return current
}

export function setCurrentWorkspaceId(id: string | null) {
  current = id
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // trình duyệt chặn storage: vẫn giữ trong bộ nhớ
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCurrentWorkspaceId(): string | null {
  return useSyncExternalStore(subscribe, getCurrentWorkspaceId)
}
