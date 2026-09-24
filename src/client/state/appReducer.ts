import type { ActiveTab, ChatMessage, ResearchSource, SourceFilter, SourceRelation, Stage } from '../../types'

export interface AppState {
  stage: Stage
  topic: string
  answers: Record<string, string>
  questionIndex: number
  sources: ResearchSource[]
  sourceRelations: SourceRelation[]
  selectedIds: Set<string>
  activeTab: ActiveTab
  sourceFilter: SourceFilter
  sourceSearch: string
  sourceSort: 'relevance' | 'year' | 'citation'
  sidebarCollapsed: boolean
  sourcesPanelOpen: boolean
  messages: ChatMessage[]
  modalSourceId: string | null
  flashSourceId: string | null
  headerTitle: string
  headerSubtitle: string
}

export const initialState: AppState = {
  stage: 'initial',
  topic: '',
  answers: {},
  questionIndex: 0,
  sources: [],
  sourceRelations: [],
  selectedIds: new Set(),
  activeTab: 'research',
  sourceFilter: 'all',
  sourceSearch: '',
  sourceSort: 'relevance',
  sidebarCollapsed: false,
  sourcesPanelOpen: false,
  messages: [],
  modalSourceId: null,
  flashSourceId: null,
  headerTitle: 'Nghiên cứu mới',
  headerSubtitle: 'Chưa bắt đầu',
}

export type Action =
  | { type: 'START_TOPIC'; topic: string; userMsgId: string; typingId: string }
  | { type: 'REPLACE_TYPING'; id: string; text: string }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'ANSWER_QUESTION'; cardId: string; questionId: string; selectedIndex: number; value: string; userMsgId: string }
  | { type: 'SET_STAGE'; stage: Stage }
  | { type: 'ADVANCE_PROGRESS'; id: string }
  | { type: 'FINISH_PROGRESS'; id: string }
  | { type: 'ADD_SOURCE'; source: ResearchSource }
  | { type: 'SET_SOURCE_RELATIONS'; relations: SourceRelation[] }
  | { type: 'SET_SOURCE_FILTER'; filter: SourceFilter }
  | { type: 'SET_SOURCE_SEARCH'; value: string }
  | { type: 'SET_SOURCE_SORT'; value: 'relevance' | 'year' | 'citation' }
  | { type: 'TOGGLE_SELECT_SOURCE'; id: string }
  | { type: 'AUTO_SELECT'; ids: string[] }
  | { type: 'SET_ACTIVE_TAB'; tab: ActiveTab }
  | { type: 'SET_HEADER'; title?: string; subtitle?: string }
  | { type: 'TOGGLE_SIDEBAR_COLLAPSED' }
  | { type: 'TOGGLE_SOURCES_PANEL' }
  | { type: 'SET_SOURCES_PANEL_OPEN'; open: boolean }
  | { type: 'OPEN_MODAL'; id: string }
  | { type: 'CLOSE_MODAL' }
  | { type: 'FLASH_SOURCE'; id: string | null }
  | { type: 'MARK_GENERATE_CLICKED'; id: string }

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START_TOPIC': {
      const userMsg: ChatMessage = { kind: 'user', id: action.userMsgId, text: action.topic }
      const typingMsg: ChatMessage = { kind: 'ai-typing', id: action.typingId }
      return {
        ...state,
        topic: action.topic,
        stage: 'questions',
        headerTitle: action.topic.length > 56 ? action.topic.slice(0, 55) + '…' : action.topic,
        headerSubtitle: 'Đang làm rõ yêu cầu nghiên cứu',
        messages: [...state.messages, userMsg, typingMsg],
      }
    }
    case 'REPLACE_TYPING': {
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? ({ kind: 'ai-text', id: action.id, text: action.text } satisfies ChatMessage) : m,
        ),
      }
    }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] }
    case 'ANSWER_QUESTION': {
      const messages = state.messages.map((m) =>
        m.kind === 'question' && m.id === action.cardId
          ? { ...m, answered: true, selectedIndex: action.selectedIndex }
          : m,
      )
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.value },
        questionIndex: state.questionIndex + 1,
        messages: [...messages, { kind: 'user', id: action.userMsgId, text: action.value }],
      }
    }
    case 'SET_STAGE':
      return { ...state, stage: action.stage }
    case 'ADVANCE_PROGRESS': {
      return {
        ...state,
        messages: state.messages.map((m) => {
          if (m.kind !== 'progress' || m.id !== action.id) return m
          const activeIndex = m.activeIndex + 1
          const doneCount = m.activeIndex >= 0 ? m.activeIndex + 1 : 0
          return { ...m, activeIndex, doneCount }
        }),
      }
    }
    case 'FINISH_PROGRESS': {
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.kind === 'progress' && m.id === action.id
            ? { ...m, finished: true, doneCount: m.steps.length }
            : m,
        ),
      }
    }
    case 'ADD_SOURCE':
      return { ...state, sources: [...state.sources, action.source] }
    case 'SET_SOURCE_RELATIONS':
      return { ...state, sourceRelations: action.relations }
    case 'SET_SOURCE_FILTER':
      return { ...state, sourceFilter: action.filter }
    case 'SET_SOURCE_SEARCH':
      return { ...state, sourceSearch: action.value }
    case 'SET_SOURCE_SORT':
      return { ...state, sourceSort: action.value }
    case 'TOGGLE_SELECT_SOURCE': {
      const next = new Set(state.selectedIds)
      if (next.has(action.id)) next.delete(action.id)
      else next.add(action.id)
      return { ...state, selectedIds: next }
    }
    case 'AUTO_SELECT': {
      const next = new Set(state.selectedIds)
      action.ids.forEach((id) => next.add(id))
      return { ...state, selectedIds: next }
    }
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab }
    case 'SET_HEADER':
      return {
        ...state,
        headerTitle: action.title ?? state.headerTitle,
        headerSubtitle: action.subtitle ?? state.headerSubtitle,
      }
    case 'TOGGLE_SIDEBAR_COLLAPSED':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    case 'TOGGLE_SOURCES_PANEL':
      return { ...state, sourcesPanelOpen: !state.sourcesPanelOpen }
    case 'SET_SOURCES_PANEL_OPEN':
      return { ...state, sourcesPanelOpen: action.open }
    case 'OPEN_MODAL':
      return { ...state, modalSourceId: action.id }
    case 'CLOSE_MODAL':
      return { ...state, modalSourceId: null }
    case 'FLASH_SOURCE':
      return { ...state, flashSourceId: action.id }
    case 'MARK_GENERATE_CLICKED':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.kind === 'generate-button' && m.id === action.id ? { ...m, clicked: true } : m,
        ),
      }
    default:
      return state
  }
}
