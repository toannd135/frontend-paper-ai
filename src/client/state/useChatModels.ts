import { useEffect, useState } from 'react'
import { fetchChatModels, type ChatModel } from '../api/chat'

const STORAGE_KEY = 'paperai.chatModel'

function readStored(): string | undefined {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? undefined
  } catch {
    return undefined
  }
}

/** Danh sách model + lựa chọn hiện tại, nhớ qua localStorage để màn hình đầu và khung chat dùng chung. */
export function useChatModels() {
  const [models, setModels] = useState<ChatModel[]>([])
  const [selectedModel, setSelected] = useState<string | undefined>(readStored)

  useEffect(() => {
    let cancelled = false
    fetchChatModels()
      .then((list) => {
        if (cancelled) return
        setModels(list)
        setSelected((current) =>
          current && list.some((m) => m.id === current && m.available)
            ? current
            : list.find((m) => m.available)?.id ?? list[0]?.id,
        )
      })
      .catch(() => {
        // Không lấy được danh sách thì chat vẫn dùng model mặc định phía backend.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setSelectedModel = (id: string) => {
    setSelected(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // bỏ qua
    }
  }

  return { models, selectedModel, setSelectedModel }
}
