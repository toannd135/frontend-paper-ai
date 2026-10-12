import type { ResearchSource, SourceRelation } from '../../types'
import { ApiError, apiFetch, toQuery } from './http'

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

export class SourceSearchError extends ApiError {}

export async function searchSources(
  query: string,
  limit = 150,
): Promise<{ sources: ResearchSource[]; relations: SourceRelation[] }> {
  const data = await apiFetch<ApiSourceSearchResponse>(
    `/sources/search${toQuery({ query, limit })}`,
    {},
    SourceSearchError,
    // (statusMessages không áp dụng cho apiFetch trực tiếp — detail của backend đã đủ rõ)
  )
  const sources: ResearchSource[] = data.sources.map((s) => ({ ...s, status: 'found' }))
  return { sources, relations: data.relations }
}
