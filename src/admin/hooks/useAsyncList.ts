import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../../client/api/http'

/** Tải danh sách từ API, hỗ trợ reload thủ công và auto-refresh khi còn phần tử đang xử lý. */
export function useAsyncList<T>(
  loader: () => Promise<{ items: T[]; total: number }>,
  options: { pollMs?: number; shouldPoll?: (items: T[]) => boolean } = {},
) {
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const result = await loaderRef.current()
      setItems(result.items)
      setTotal(result.total)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được dữ liệu từ máy chủ.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const { pollMs, shouldPoll } = options
  useEffect(() => {
    if (!pollMs || !shouldPoll || !shouldPoll(items)) return
    const handle = setTimeout(() => void reload(true), pollMs)
    return () => clearTimeout(handle)
  }, [items, pollMs, shouldPoll, reload])

  return { items, total, loading, error, reload }
}
