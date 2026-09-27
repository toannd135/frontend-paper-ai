export type Stage =
  | 'initial'
  | 'questions'
  | 'specification'
  | 'researching'
  | 'research-complete'
  | 'generating'
  | 'article'

export type ActiveTab = 'research' | 'article' | 'graph'

export type SourceFilter = 'all' | 'selected' | 'high' | 'recent'

export interface Conversation {
  id: string
  title: string
}

export interface ResearchSourceRaw {
  title: string
  authors: string
  year: number
  publisher: string
  type: string
  doi: string
  relevance: number
  citations: number
  abstract?: string | null
}

export interface ResearchSource extends ResearchSourceRaw {
  id: string
  status: 'found' | 'rejected'
}

export type SourceRelationKind = 'cites' | 'related'

export interface SourceRelation {
  source: string
  target: string
  kind: SourceRelationKind
}

export type ResearchStatus = 'pending' | 'processing' | 'done' | 'failed'
export type PaperStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface Citation {
  paperId: string
  chunkId: string
  page: number | null
  section: string | null
  textSnippet: string
}

export interface ClarificationAnswer {
  question: string
  answer: string
}

export type ChatMessage =
  | { kind: 'user'; id: string; text: string }
  | { kind: 'ai-typing'; id: string }
  | { kind: 'ai-text'; id: string; text: string; citations?: Citation[] }
  | {
      kind: 'clarify'
      id: string
      prompt: string
      answered: boolean
      value: string
    }
  | { kind: 'specification'; id: string }
  | {
      kind: 'progress'
      id: string
      progressKey: 'researching' | 'generating'
      steps: string[]
      activeIndex: number
      doneCount: number
      finished: boolean
    }
  | { kind: 'generate-button'; id: string; clicked: boolean }
  | { kind: 'paper-upload'; id: string; filename: string; status: PaperStatus; error: string | null }
