import type { ResearchSource, SourceRelation } from '../../types'

interface ApiExternalSource {
  id: string
  title: string
  authors: string
  year: number
  publisher: string
  type: string
  doi: string
  relevance: number
  citations: number
  abstract: string | null
}

interface ApiSourceSearchResponse {
  sources: ApiExternalSource[]
  relations: SourceRelation[]
}

export class SourceSearchError extends Error {}

export async function searchSources(query: string, limit = 150): Promise<{
  sources: ResearchSource[]
  relations: SourceRelation[]
}> {
  let response: Response
  try {
    response = await fetch(`/api/sources/search?query=${encodeURIComponent(query)}&limit=${limit}`)
  } catch {
    throw new SourceSearchError('Không thể kết nối tới máy chủ paperai (kiểm tra backend đã chạy chưa).')
  }

  if (!response.ok) {
    throw new SourceSearchError(`OpenAlex/paperai API trả lỗi (${response.status}).`)
  }

  const data = (await response.json()) as ApiSourceSearchResponse
  const sources: ResearchSource[] = data.sources.map((s) => ({
    id: s.id,
    title: s.title,
    authors: s.authors,
    year: s.year,
    publisher: s.publisher,
    type: s.type,
    doi: s.doi,
    relevance: s.relevance,
    citations: s.citations,
    abstract: s.abstract,
    status: 'found',
  }))

  return { sources, relations: data.relations }
}
