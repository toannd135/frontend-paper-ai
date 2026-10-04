import type {
  ActiveTab,
  ChatMessage,
  Citation,
  ClarificationQuestionSpec,
  PaperStatus,
  ResearchHistoryItem,
  ResearchSource,
  SourceFilter,
  SourceRelation,
  Stage,
} from '../../types'

export type SourceSort = 'relevance' | 'year' | 'citation'

export interface AppState {
  stage: Stage
  topic: string
  clarificationQuestions: ClarificationQuestionSpec[]
  clarificationIndex: number
  clarificationAnswers: Record<string, string>
  researchTaskId: string | null
  report: string | null
  citations: Citation[]
  conversationId: string | null
  paperId: string | null
  sources: ResearchSource[]
  sourceRelations: SourceRelation[]
  selectedIds: Set<string>
  activeTab: ActiveTab
  sourceFilter: SourceFilter
  sourceSearch: string
  sourceSort: SourceSort
  sidebarCollapsed: boolean
  sourcesPanelOpen: boolean
  messages: ChatMessage[]
  modalSourceId: string | null
  flashSourceId: string | null
  headerTitle: string
  headerSubtitle: string
  history: ResearchHistoryItem[]
  historyLoading: boolean
  historyError: string | null
}

export const initialState: AppState = {
  stage: 'initial',
  topic: '',
  clarificationQuestions: [],
  clarificationIndex: 0,
  clarificationAnswers: {},
  researchTaskId: null,
  report: null,
  citations: [],
  conversationId: null,
  paperId: null,
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
  history: [],
  historyLoading: false,
  historyError: null,
}

/** Reset về trạng thái ban đầu nhưng giữ các tuỳ chọn giao diện và lịch sử đã tải. */
export function freshSession(state: AppState): AppState {
  return {
    ...initialState,
    sidebarCollapsed: state.sidebarCollapsed,
    history: state.history,
    historyLoading: state.historyLoading,
    historyError: state.historyError,
  }
}

function truncateTitle(text: string, max = 56): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

export type Action =
  | { type: 'RESET' }
  | { type: 'START_TOPIC'; topic: string; userMsgId: string; typingId: string }
  | { type: 'START_CHAT'; title: string }
  | { type: 'REPLACE_TYPING'; id: string; text: string; citations?: Citation[]; tone?: 'info' | 'error' | 'success' }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'SET_CLARIFICATION_QUESTIONS'; questions: ClarificationQuestionSpec[] }
  | { type: 'ANSWER_CLARIFY'; cardId: string; value: string; userMsgId: string }
  | { type: 'SET_RESEARCH_TASK'; id: string }
  | { type: 'SET_RESEARCH_RESULT'; report: string; citations: Citation[] }
  | { type: 'SET_RESEARCH_ERROR' }
  | {
      type: 'LOAD_RESEARCH_TASK'
      id: string
      question: string
      report: string | null
      citations: Citation[]
      status: string
      summaryMsgId: string
    }
  | { type: 'SET_CONVERSATION_ID'; id: string }
  | { type: 'SET_PAPER_ID'; id: string | null }
  | { type: 'UPDATE_PAPER_UPLOAD'; id: string; status: PaperStatus; error: string | null }
  | { type: 'SET_STAGE'; stage: Stage }
  | { type: 'ADVANCE_PROGRESS'; id: string }
  | { type: 'FINISH_PROGRESS'; id: string }
  | { type: 'ADD_SOURCES'; sources: ResearchSource[] }
  | { type: 'SET_SOURCE_RELATIONS'; relations: SourceRelation[] }
  | { type: 'SET_SOURCE_FILTER'; filter: SourceFilter }
  | { type: 'SET_SOURCE_SEARCH'; value: string }
  | { type: 'SET_SOURCE_SORT'; value: SourceSort }
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
  | { type: 'HISTORY_LOADING' }
  | { type: 'SET_HISTORY'; items: ResearchHistoryItem[] }
  | { type: 'HISTORY_ERROR'; message: string }
  | { type: 'REMOVE_HISTORY_ITEM'; id: string }

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'RESET':
      return freshSession(state)
    case 'START_TOPIC': {
      const userMsg: ChatMessage = { kind: 'user', id: action.userMsgId, text: action.topic }
      const typingMsg: ChatMessage = { kind: 'ai-typing', id: action.typingId }
      return {
        ...freshSession(state),
        topic: action.topic,
        stage: 'questions',
        headerTitle: truncateTitle(action.topic),
        headerSubtitle: 'Đang làm rõ yêu cầu nghiên cứu',
        messages: [userMsg, typingMsg],
      }
    }
    case 'START_CHAT':
      return {
        ...freshSession(state),
        stage: 'chat',
        topic: action.title,
        headerTitle: truncateTitle(action.title),
        headerSubtitle: 'Hỏi đáp trực tiếp với tài liệu',
      }
    case 'REPLACE_TYPING': {
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id
            ? ({
                kind: 'ai-text',
                id: action.id,
                text: action.text,
                citations: action.citations,
                tone: action.tone,
              } satisfies ChatMessage)
            : m,
        ),
      }
    }
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] }
    case 'SET_CLARIFICATION_QUESTIONS':
      return { ...state, clarificationQuestions: action.questions, clarificationIndex: 0 }
    case 'ANSWER_CLARIFY': {
      const target = state.messages.find((m) => m.kind === 'clarify' && m.id === action.cardId)
      const prompt = target && target.kind === 'clarify' ? target.prompt : ''
      const messages = state.messages.map((m) =>
        m.kind === 'clarify' && m.id === action.cardId ? { ...m, answered: true, value: action.value } : m,
      )
      return {
        ...state,
        clarificationAnswers: { ...state.clarificationAnswers, [prompt]: action.value },
        clarificationIndex: state.clarificationIndex + 1,
        messages: [...messages, { kind: 'user', id: action.userMsgId, text: action.value }],
      }
    }
    case 'SET_RESEARCH_TASK':
      return { ...state, researchTaskId: action.id }
    case 'SET_RESEARCH_RESULT':
      return { ...state, report: action.report, citations: action.citations }
    case 'SET_RESEARCH_ERROR':
      return { ...state, researchTaskId: null }
    case 'LOAD_RESEARCH_TASK': {
      const done = action.status === 'done' && !!action.report
      const summary: ChatMessage = {
        kind: 'ai-text',
        id: action.summaryMsgId,
        text: done
          ? `Đã mở lại báo cáo nghiên cứu với ${action.citations.length} trích dẫn. Bạn có thể xem ở tab Article hoặc tiếp tục hỏi đáp tại đây.`
          : action.status === 'failed'
            ? 'Phiên nghiên cứu này đã thất bại trước đó. Bạn có thể bắt đầu lại với câu hỏi mới.'
            : 'Phiên nghiên cứu này vẫn đang xử lý. Hệ thống sẽ tiếp tục kiểm tra trạng thái.',
        tone: done ? 'success' : action.status === 'failed' ? 'error' : 'info',
      }
      return {
        ...freshSession(state),
        stage: done ? 'article' : action.status === 'failed' ? 'research-complete' : 'researching',
        topic: action.question,
        researchTaskId: action.id,
        report: action.report,
        citations: action.citations,
        headerTitle: truncateTitle(action.question),
        headerSubtitle: done ? 'Bài báo đã sẵn sàng' : action.status === 'failed' ? 'Nghiên cứu thất bại' : 'Đang nghiên cứu chủ đề...',
        activeTab: done ? 'article' : 'research',
        messages: [{ kind: 'user', id: `${action.summaryMsgId}_u`, text: action.question }, summary],
      }
    }
    case 'SET_CONVERSATION_ID':
      return { ...state, conversationId: action.id }
    case 'SET_PAPER_ID':
      return { ...state, paperId: action.id }
    case 'UPDATE_PAPER_UPLOAD': {
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.kind === 'paper-upload' && m.id === action.id ? { ...m, status: action.status, error: action.error } : m,
        ),
      }
    }
    case 'SET_STAGE':
      return { ...state, stage: action.stage }
    case 'ADVANCE_PROGRESS': {
      return {
        ...state,
        messages: state.messages.map((m) => {
          if (m.kind !== 'progress' || m.id !== action.id || m.finished) return m
          const activeIndex = Math.min(m.activeIndex + 1, m.steps.length - 1)
          const doneCount = Math.min(m.activeIndex >= 0 ? m.activeIndex + 1 : 0, m.steps.length - 1)
          return { ...m, activeIndex, doneCount }
        }),
      }
    }
    case 'FINISH_PROGRESS': {
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.kind === 'progress' && m.id === action.id ? { ...m, finished: true, doneCount: m.steps.length } : m,
        ),
      }
    }
    case 'ADD_SOURCES': {
      const existing = new Set(state.sources.map((s) => s.id))
      const fresh = action.sources.filter((s) => !existing.has(s.id))
      return fresh.length ? { ...state, sources: [...state.sources, ...fresh] } : state
    }
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
    case 'HISTORY_LOADING':
      return { ...state, historyLoading: true, historyError: null }
    case 'SET_HISTORY':
      return { ...state, history: action.items, historyLoading: false, historyError: null }
    case 'HISTORY_ERROR':
      return { ...state, historyLoading: false, historyError: action.message }
    case 'REMOVE_HISTORY_ITEM':
      return { ...state, history: state.history.filter((h) => h.id !== action.id) }
    default:
      return state
  }
}
