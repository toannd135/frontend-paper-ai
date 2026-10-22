import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { ActiveTab, ChatMessage, ResearchHistoryItem, ClarificationAnswer, SourceFilter } from '../../types'
import { researchingSteps } from '../constants'
import { ApiError } from '../api/http'
import { searchSources } from '../api/sources'
import {
  answerClarification,
  createResearch,
  deleteResearchTask,
  getResearchTask,
  listResearchTasks,
} from '../api/research'
import { getConversationByResearch, sendChat } from '../api/chat'
import { uploadPaper, getPaper } from '../api/papers'
import { appReducer, initialState, type AppState, type SourceSort } from './appReducer'

const DRAFT_PREFIX = 'draft_'
const DRAFT_INDEX_KEY = 'paperai.drafts'
const isDraftId = (id: string) => id.startsWith(DRAFT_PREFIX)
const newDraftId = () => `${DRAFT_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const sessionKey = (id: string) => `paperai.session.${id}`

function readDrafts(): ResearchHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_INDEX_KEY) ?? '[]') as ResearchHistoryItem[]
  } catch {
    return []
  }
}

function writeDrafts(items: ResearchHistoryItem[]) {
  try {
    localStorage.setItem(DRAFT_INDEX_KEY, JSON.stringify(items))
  } catch {
    // bỏ qua
  }
}

function dropDraft(id: string) {
  writeDrafts(readDrafts().filter((d) => d.id !== id))
  try {
    localStorage.removeItem(sessionKey(id))
  } catch {
    // bỏ qua
  }
}

// Khởi tạo theo thời gian để id không trùng với tin nhắn đã lưu từ lần tải trang trước.
let counter = Date.now() % 1_000_000_000
function uid(prefix: string) {
  counter += 1
  return `${prefix}_${counter}`
}

const RESEARCH_POLL_MS = 2500
// Panel chỉ hiển thị các nguồn liên quan nhất; agent vẫn tìm trên toàn bộ kho ở backend.
const TOP_SOURCES = 20
const PAPER_POLL_MS = 1500
const HISTORY_LIMIT = 100

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback
}

export function useAppController() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  // Snapshot "sống" cho các callback chạy sau setTimeout/await.
  const stateRef = useRef(state)
  stateRef.current = state

  // Mọi timer đều đi qua schedule() để RESET/unmount huỷ được toàn bộ poll cũ,
  // tránh việc một phiên nghiên cứu cũ ghi đè lên phiên mới.
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const sessionRef = useRef(0)

  const schedule = useCallback((fn: () => void, ms: number) => {
    const session = sessionRef.current
    const handle = setTimeout(() => {
      timersRef.current.delete(handle)
      if (sessionRef.current === session) fn()
    }, ms)
    timersRef.current.add(handle)
    return handle
  }, [])

  const cancelAllTimers = useCallback(() => {
    timersRef.current.forEach((h) => clearTimeout(h))
    timersRef.current.clear()
    sessionRef.current += 1
  }, [])

  useEffect(() => cancelAllTimers, [cancelAllTimers])

  // ---------------------------------------------------------------- history
  const refreshHistory = useCallback(async () => {
    dispatch({ type: 'HISTORY_LOADING' })
    try {
      const { items } = await listResearchTasks({ limit: HISTORY_LIMIT })
      dispatch({
        type: 'SET_HISTORY',
        items: [
          ...readDrafts(),
          ...items.map((t) => ({
            id: t.id,
            question: t.question,
            status: t.status,
            hasReport: t.hasReport,
            citationCount: t.citationCount,
            createdAt: t.createdAt,
          })),
        ],
      })
    } catch (err) {
      dispatch({ type: 'HISTORY_ERROR', message: errorMessage(err, 'Không tải được lịch sử nghiên cứu.') })
    }
  }, [])

  useEffect(() => {
    void refreshHistory()
  }, [refreshHistory])

  // ---------------------------------------------------------------- helpers
  const appendAiTypingThenText = useCallback(
    (text: string, cb?: () => void, tone?: 'info' | 'error' | 'success') => {
      const id = uid('ai')
      dispatch({ type: 'ADD_MESSAGE', message: { kind: 'ai-typing', id } })
      schedule(() => {
        dispatch({ type: 'REPLACE_TYPING', id, text, tone })
        if (cb) cb()
      }, 650)
    },
    [schedule],
  )

  const warn = useCallback(
    (text: string) => appendAiTypingThenText(text, undefined, 'error'),
    [appendAiTypingThenText],
  )

  const populateSourcesProgressively = useCallback(
    async (query: string) => {
      try {
        const found = await searchSources(query)
        // Giữ TOP_SOURCES bài liên quan nhất và chỉ các quan hệ nằm trọn trong tập đó.
        const sources = [...found.sources].sort((a, b) => b.relevance - a.relevance).slice(0, TOP_SOURCES)
        const keptIds = new Set(sources.map((s) => s.id))
        const relations = found.relations.filter((r) => keptIds.has(r.source) && keptIds.has(r.target))
        dispatch({ type: 'SET_SOURCE_RELATIONS', relations })
        // Ít nguồn: hiện từng cái cho mượt; nhiều nguồn: gộp lô để tổng thời gian ~8s bất kể số lượng.
        const batchSize = Math.max(1, Math.ceil(sources.length / 40))
        const tickDelay = batchSize === 1 ? 260 : 200
        let i = 0
        const addBatch = () => {
          if (i >= sources.length) return
          dispatch({ type: 'ADD_SOURCES', sources: sources.slice(i, i + batchSize) })
          i += batchSize
          schedule(addBatch, tickDelay)
        }
        addBatch()
      } catch (err) {
        warn(`⚠ ${errorMessage(err, 'Không tìm được nguồn từ OpenAlex.')}`)
      }
    },
    [schedule, warn],
  )

  const onArticleReady = useCallback(() => {
    dispatch({ type: 'SET_STAGE', stage: 'article' })
    dispatch({ type: 'SET_HEADER', subtitle: 'Bài báo đã sẵn sàng' })
    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        kind: 'ai-text',
        id: uid('ai'),
        text: '✓ Bài báo đã sẵn sàng ở tab Article. Bạn có thể xuất PDF hoặc tiếp tục hỏi đáp tại đây.',
        tone: 'success',
      },
    })
    dispatch({ type: 'SET_ACTIVE_TAB', tab: 'article' })
  }, [])

  const onResearchComplete = useCallback(() => {
    dispatch({ type: 'SET_STAGE', stage: 'research-complete' })
    const sources = stateRef.current.sources
    const citationCount = stateRef.current.citations.length
    dispatch({ type: 'SET_HEADER', subtitle: `${sources.length} nguồn tham khảo đã tìm thấy` })
    void refreshHistory()

    appendAiTypingThenText(
      citationCount > 0
        ? `✓ Đã tổng hợp xong báo cáo nghiên cứu với ${citationCount} trích dẫn từ kho tài liệu đã lập chỉ mục và OpenAlex.\nCác nguồn học thuật liên quan nằm ở panel Nguồn tài liệu bên phải.`
        : `✓ Đã tổng hợp xong báo cáo nghiên cứu.\nLưu ý: chưa có trích dẫn nào được gắn — hãy tải lên paper liên quan để cải thiện chất lượng.`,
      () => {
        dispatch({ type: 'ADD_MESSAGE', message: { kind: 'generate-button', id: uid('gen'), clicked: false } })
      },
      'success',
    )
  }, [appendAiTypingThenText, refreshHistory])

  const pollResearchTask = useCallback(
    (taskId: string, progressId: string | null) => {
      const tick = async () => {
        try {
          const task = await getResearchTask(taskId)
          if (task.status === 'done') {
            dispatch({ type: 'SET_RESEARCH_RESULT', report: task.report ?? '', citations: task.citations })
            if (progressId) dispatch({ type: 'FINISH_PROGRESS', id: progressId })
            schedule(onResearchComplete, 300)
            return
          }
          if (task.status === 'failed') {
            dispatch({ type: 'SET_RESEARCH_ERROR' })
            if (progressId) dispatch({ type: 'FINISH_PROGRESS', id: progressId })
            dispatch({ type: 'SET_HEADER', subtitle: 'Nghiên cứu thất bại' })
            warn(`⚠ Nghiên cứu thất bại: ${task.error ?? 'lỗi không xác định'}.`)
            void refreshHistory()
            return
          }
          if (progressId) dispatch({ type: 'ADVANCE_PROGRESS', id: progressId })
          schedule(tick, RESEARCH_POLL_MS)
        } catch (err) {
          dispatch({ type: 'SET_RESEARCH_ERROR' })
          if (progressId) dispatch({ type: 'FINISH_PROGRESS', id: progressId })
          warn(`⚠ ${errorMessage(err, 'Không thể kiểm tra trạng thái nghiên cứu.')}`)
        }
      }
      schedule(tick, RESEARCH_POLL_MS)
    },
    [onResearchComplete, refreshHistory, schedule, warn],
  )

  const beginResearch = useCallback(() => {
    const taskId = stateRef.current.researchTaskId
    if (!taskId) return
    dispatch({ type: 'SET_STAGE', stage: 'researching' })
    dispatch({ type: 'SET_SOURCES_PANEL_OPEN', open: true })
    dispatch({ type: 'SET_HEADER', subtitle: 'Đang nghiên cứu chủ đề...' })
    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        kind: 'ai-text',
        id: uid('ai'),
        text: 'Đang nghiên cứu chủ đề của bạn. Quá trình gồm nhiều lượt gọi mô hình ngôn ngữ nên có thể mất vài phút.',
      },
    })
    const progressId = uid('progress')
    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        kind: 'progress',
        id: progressId,
        progressKey: 'researching',
        steps: researchingSteps,
        activeIndex: -1,
        doneCount: 0,
        finished: false,
      },
    })
    void populateSourcesProgressively(stateRef.current.topic)
    pollResearchTask(taskId, progressId)
    void refreshHistory()
  }, [pollResearchTask, populateSourcesProgressively, refreshHistory])

  const askClarify = useCallback((index: number) => {
    const question = stateRef.current.clarificationQuestions[index]
    if (!question) return
    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        kind: 'clarify',
        id: uid('clarify'),
        prompt: question.text,
        suggestions: question.suggestions,
        answered: false,
        value: '',
      },
    })
  }, [])

  const goToSpecification = useCallback(() => {
    dispatch({ type: 'SET_STAGE', stage: 'specification' })
    appendAiTypingThenText('Cảm ơn bạn! Đây là bản đặc tả nghiên cứu tôi đã tổng hợp:', () => {
      dispatch({ type: 'ADD_MESSAGE', message: { kind: 'specification', id: uid('spec') } })
    })
  }, [appendAiTypingThenText])

  // ---------------------------------------------------------------- actions
  /** Giữ lại phiên đang chạy trước khi rời đi, để quay lại không mất tin nhắn/tiến độ. */
  const stashedRef = useRef<Map<string, AppState>>(new Map())
  const stashSession = useCallback(() => {
    const current = stateRef.current
    const key = current.researchTaskId ?? current.draftId
    if (!key || current.messages.length === 0) return
    stashedRef.current.set(key, current)
    try {
      // Cũng ghi ra localStorage để phiên sống sót qua việc tải lại trang.
      const { history: _h, historyLoading: _l, historyError: _e, ...rest } = current
      localStorage.setItem(sessionKey(key), JSON.stringify(rest))
      if (!current.researchTaskId && current.draftId) {
        const drafts = readDrafts().filter((d) => d.id !== key)
        writeDrafts([
          {
            id: key,
            question: current.topic || current.headerTitle,
            status: 'pending',
            hasReport: false,
            citationCount: 0,
            createdAt: new Date().toISOString(),
          },
          ...drafts,
        ])
      }
    } catch {
      // localStorage đầy hoặc bị chặn: vẫn còn bản trong bộ nhớ.
    }
  }, [])

  useEffect(() => {
    window.addEventListener('beforeunload', stashSession)
    return () => window.removeEventListener('beforeunload', stashSession)
  }, [stashSession])

  // Phiên nháp (chưa có research task) phải hiện ở sidebar ngay và còn sau F5.
  useEffect(() => {
    if (!state.draftId || state.researchTaskId || state.messages.length === 0) return
    stashSession()
    const drafts = readDrafts()
    const current = state.history.filter((h) => !isDraftId(h.id))
    const merged = [...drafts, ...current]
    const same = merged.length === state.history.length && merged.every((h, i) => h.id === state.history[i].id)
    if (!same) dispatch({ type: 'SET_HISTORY', items: merged })
  }, [state.draftId, state.researchTaskId, state.messages, state.history, stashSession])

  const readStashed = useCallback((id: string): AppState | undefined => {
    const inMemory = stashedRef.current.get(id)
    if (inMemory) return inMemory
    try {
      const raw = localStorage.getItem(sessionKey(id))
      if (!raw) return undefined
      return { ...initialState, ...(JSON.parse(raw) as Partial<AppState>) }
    } catch {
      return undefined
    }
  }, [])

  const startNewResearch = useCallback(() => {
    stashSession()
    cancelAllTimers()
    dispatch({ type: 'RESET' })
  }, [cancelAllTimers, stashSession])

  const submitTopic = useCallback(
    (topic: string) => {
      const trimmed = topic.trim()
      if (!trimmed) return
      cancelAllTimers()
      dispatch({ type: 'START_TOPIC', topic: trimmed, userMsgId: uid('u'), draftId: newDraftId() })
      appendAiTypingThenText(
        'Tôi đã hiểu chủ đề nghiên cứu của bạn.\nĐể xây dựng một bài báo phù hợp hơn, tôi cần xác định thêm một vài thông tin.',
        async () => {
          try {
            const result = await createResearch(trimmed)
            if (result.kind === 'clarification') {
              dispatch({ type: 'SET_CLARIFICATION_QUESTIONS', questions: result.questions })
              schedule(() => askClarify(0), 400)
            } else {
              {
                const draftId = stateRef.current.draftId
                if (draftId) dropDraft(draftId)
              }
              dispatch({ type: 'SET_RESEARCH_TASK', id: result.task.id })
              schedule(goToSpecification, 400)
            }
          } catch (err) {
            warn(`⚠ ${errorMessage(err, 'Không thể bắt đầu nghiên cứu.')}`)
          }
        },
      )
    },
    [appendAiTypingThenText, askClarify, cancelAllTimers, goToSpecification, schedule, warn],
  )

  const answerClarify = useCallback(
    (cardId: string, value: string) => {
      dispatch({ type: 'ANSWER_CLARIFY', cardId, value, userMsgId: uid('u') })

      const nextIndex = stateRef.current.clarificationIndex + 1
      if (nextIndex < stateRef.current.clarificationQuestions.length) {
        schedule(() => askClarify(nextIndex), 500)
        return
      }

      schedule(async () => {
        try {
          const answers = { ...stateRef.current.clarificationAnswers }
          const result = await answerClarification(stateRef.current.topic, answers)
          if (result.kind === 'clarification') {
            dispatch({
              type: 'SET_CLARIFICATION_QUESTIONS',
              questions: [...stateRef.current.clarificationQuestions, ...result.questions],
            })
            askClarify(stateRef.current.clarificationQuestions.length)
            return
          }
          {
                const draftId = stateRef.current.draftId
                if (draftId) dropDraft(draftId)
              }
              dispatch({ type: 'SET_RESEARCH_TASK', id: result.task.id })
          goToSpecification()
        } catch (err) {
          warn(`⚠ ${errorMessage(err, 'Không thể bắt đầu nghiên cứu.')}`)
        }
      }, 450)
    },
    [askClarify, goToSpecification, schedule, warn],
  )

  const sendChatMessage = useCallback((text: string, model?: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    dispatch({ type: 'ADD_MESSAGE', message: { kind: 'user', id: uid('u'), text: trimmed } })
    const id = uid('ai')
    dispatch({ type: 'ADD_MESSAGE', message: { kind: 'ai-typing', id } })
    void (async () => {
      try {
        const result = await sendChat(trimmed, {
          paperId: stateRef.current.paperId,
          conversationId: stateRef.current.conversationId,
          researchTaskId: stateRef.current.researchTaskId,
          model,
        })
        dispatch({ type: 'SET_CONVERSATION_ID', id: result.conversationId })
        dispatch({ type: 'REPLACE_TYPING', id, text: result.answer, citations: result.citations })
      } catch (err) {
        dispatch({
          type: 'REPLACE_TYPING',
          id,
          text: `⚠ ${errorMessage(err, 'Không thể liên hệ máy chủ paperai.')}`,
          tone: 'error',
        })
      }
    })()
  }, [])

  const uploadPaperFile = useCallback(
    (file: File) => {
      const msgId = uid('paper')
      dispatch({
        type: 'ADD_MESSAGE',
        message: { kind: 'paper-upload', id: msgId, filename: file.name, status: 'pending', error: null },
      })

      void (async () => {
        try {
          const info = await uploadPaper(file)
          dispatch({ type: 'SET_PAPER_ID', id: info.id })
          dispatch({ type: 'UPDATE_PAPER_UPLOAD', id: msgId, status: info.status, error: null })

          const poll = async () => {
            try {
              const status = await getPaper(info.id)
              dispatch({ type: 'UPDATE_PAPER_UPLOAD', id: msgId, status: status.status, error: status.error })
              if (status.status === 'done') {
                appendAiTypingThenText(
                  `✓ Đã lập chỉ mục "${status.filename}". Câu hỏi tiếp theo sẽ được trả lời dựa trên tài liệu này.`,
                  undefined,
                  'success',
                )
                return
              }
              if (status.status === 'failed') {
                warn(`⚠ Xử lý tài liệu thất bại: ${status.error ?? 'lỗi không xác định'}.`)
                return
              }
              schedule(poll, PAPER_POLL_MS)
            } catch (err) {
              const message = errorMessage(err, 'Không thể kiểm tra trạng thái tài liệu.')
              dispatch({ type: 'UPDATE_PAPER_UPLOAD', id: msgId, status: 'failed', error: message })
            }
          }
          schedule(poll, PAPER_POLL_MS)
        } catch (err) {
          const message = errorMessage(err, 'Không thể tải lên tài liệu.')
          dispatch({ type: 'UPDATE_PAPER_UPLOAD', id: msgId, status: 'failed', error: message })
          warn(`⚠ ${message}`)
        }
      })()
    },
    [appendAiTypingThenText, schedule, warn],
  )

  /** Chế độ hỏi-đáp trực tiếp với 1 PDF: không chạy research agent. */
  const startChatWithPaper = useCallback(
    (file: File) => {
      cancelAllTimers()
      dispatch({ type: 'START_CHAT', title: file.name, draftId: newDraftId() })
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          kind: 'ai-text',
          id: uid('ai'),
          text: 'Đang tải và lập chỉ mục tài liệu. Khi hoàn tất, bạn có thể hỏi bất kỳ điều gì về nội dung PDF này.',
        },
      })
      uploadPaperFile(file)
    },
    [cancelAllTimers, uploadPaperFile],
  )

  /** Nạp lại hỏi đáp đã lưu ở server cho phiên nghiên cứu vừa mở. */
  const restoreChatHistory = useCallback(async (taskId: string) => {
    try {
      const conv = await getConversationByResearch(taskId)
      // Người dùng có thể đã chuyển sang phiên khác trong lúc chờ.
      if (!conv || stateRef.current.researchTaskId !== taskId) return
      dispatch({ type: 'SET_CONVERSATION_ID', id: conv.id })
      for (const m of conv.messages) {
        dispatch({
          type: 'ADD_MESSAGE',
          message:
            m.role === 'user'
              ? { kind: 'user', id: uid('u'), text: m.content }
              : { kind: 'ai-text', id: uid('ai'), text: m.content, citations: m.citations },
        })
      }
    } catch {
      // Không tải được lịch sử hỏi đáp: vẫn mở phiên bình thường.
    }
  }, [])

  /** Mở lại một phiên nghiên cứu từ lịch sử (sidebar). */
  const openResearchTask = useCallback(
    async (id: string) => {
      stashSession()
      cancelAllTimers()
      if (isDraftId(id)) {
        const draft = readStashed(id)
        if (draft) {
          dispatch({
            type: 'RESTORE_SESSION',
            snapshot: { ...draft, messages: draft.messages.filter((m) => m.kind !== 'ai-typing') },
          })
        } else {
          dropDraft(id)
          void refreshHistory()
        }
        return
      }
      try {
        const task = await getResearchTask(id)
        const stashed = readStashed(id)
        if (stashed && (task.status === 'pending' || task.status === 'processing')) {
          // Phiên vẫn đang chạy: khôi phục nguyên trạng và tiếp tục theo dõi tiến độ.
          dispatch({ type: 'RESTORE_SESSION', snapshot: stashed })
          const progress = [...stashed.messages].reverse().find((m) => m.kind === 'progress' && !m.finished)
          pollResearchTask(task.id, progress ? progress.id : null)
          return
        }
        stashedRef.current.delete(id)
        dispatch({
          type: 'LOAD_RESEARCH_TASK',
          id: task.id,
          question: task.question,
          report: task.report,
          citations: task.citations,
          status: task.status,
          summaryMsgId: uid('ai'),
        })
        void restoreChatHistory(task.id)
        if (task.status === 'pending' || task.status === 'processing') {
          pollResearchTask(task.id, null)
        }
        // Nguồn OpenAlex phục vụ panel Research Sources + Graph; không gọi LLM nên rẻ.
        void populateSourcesProgressively(task.question)
      } catch (err) {
        dispatch({ type: 'RESET' })
        warn(`⚠ ${errorMessage(err, 'Không mở được phiên nghiên cứu.')}`)
      }
    },
    [cancelAllTimers, pollResearchTask, populateSourcesProgressively, readStashed, refreshHistory, restoreChatHistory, stashSession, warn],
  )

  const removeResearchTask = useCallback(
    async (id: string) => {
      if (isDraftId(id)) {
        dropDraft(id)
        stashedRef.current.delete(id)
        dispatch({ type: 'REMOVE_HISTORY_ITEM', id })
        if (stateRef.current.draftId === id) {
          // Không gọi startNewResearch: nó sẽ ghi lại nháp vừa xoá.
          cancelAllTimers()
          dispatch({ type: 'RESET' })
        }
        return
      }
      try {
        await deleteResearchTask(id)
        // Xoá luôn bản lưu tạm của phiên (bộ nhớ + localStorage) để phiên đã xoá không sống lại.
        dropDraft(id)
        stashedRef.current.delete(id)
        dispatch({ type: 'REMOVE_HISTORY_ITEM', id })
        if (stateRef.current.researchTaskId === id) {
          // Không gọi startNewResearch: nó sẽ lưu tạm lại đúng phiên vừa xoá. Dừng theo dõi tiến độ
          // rồi chuyển về phiên làm việc mới.
          cancelAllTimers()
          dispatch({ type: 'RESET' })
        }
      } catch (err) {
        dispatch({ type: 'HISTORY_ERROR', message: errorMessage(err, 'Không xoá được phiên nghiên cứu.') })
      }
    },
    [cancelAllTimers],
  )

  const beginArticleFromButton = useCallback(
    (btnId: string) => {
      dispatch({ type: 'MARK_GENERATE_CLICKED', id: btnId })
      onArticleReady()
    },
    [onArticleReady],
  )

  const setSourceFilter = useCallback((filter: SourceFilter) => dispatch({ type: 'SET_SOURCE_FILTER', filter }), [])
  const setSourceSearch = useCallback((value: string) => dispatch({ type: 'SET_SOURCE_SEARCH', value }), [])
  const setSourceSort = useCallback((value: SourceSort) => dispatch({ type: 'SET_SOURCE_SORT', value }), [])
  const openPaperModal = useCallback((id: string) => dispatch({ type: 'OPEN_MODAL', id }), [])
  const closePaperModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), [])
  const setActiveTab = useCallback((tab: ActiveTab) => dispatch({ type: 'SET_ACTIVE_TAB', tab }), [])
  const toggleSidebarCollapsed = useCallback(() => dispatch({ type: 'TOGGLE_SIDEBAR_COLLAPSED' }), [])
  const toggleSourcesPanel = useCallback(() => dispatch({ type: 'TOGGLE_SOURCES_PANEL' }), [])
  const beginResearchFromSpec = useCallback(() => beginResearch(), [beginResearch])

  const chatMessages: ChatMessage[] = state.messages

  const clarificationAnswerList: ClarificationAnswer[] = state.clarificationQuestions.map((q) => ({
    question: q.text,
    answer: state.clarificationAnswers[q.text] ?? '',
  }))

  return {
    state,
    chatMessages,
    clarificationAnswerList,
    submitTopic,
    startNewResearch,
    startChatWithPaper,
    openResearchTask,
    removeResearchTask,
    refreshHistory,
    answerClarify,
    beginResearchFromSpec,
    beginArticleFromButton,
    setSourceFilter,
    setSourceSearch,
    setSourceSort,
    openPaperModal,
    closePaperModal,
    setActiveTab,
    sendChatMessage,
    uploadPaperFile,
    toggleSidebarCollapsed,
    toggleSourcesPanel,
  }
}

export type AppController = ReturnType<typeof useAppController>
