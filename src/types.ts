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

export interface ResearchQuestion {
  id: string
  prompt: string
  options: string[]
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

export type ChatMessage =
  | { kind: 'user'; id: string; text: string }
  | { kind: 'ai-typing'; id: string }
  | { kind: 'ai-text'; id: string; text: string }
  | {
      kind: 'question'
      id: string
      questionId: string
      prompt: string
      options: string[]
      answered: boolean
      selectedIndex: number | null
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
