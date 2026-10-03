import { useCallback, useReducer, useRef } from 'react'
import type { ActiveTab, ChatMessage, ClarificationAnswer, SourceFilter } from '../../types'
import { generatingSteps, researchingSteps } from '../../data/mock'
import { searchSources, SourceSearchError } from '../api/sources'
import { answerClarification, createResearch, getResearchTask, ResearchError } from '../api/research'
import { sendChat, ChatError } from '../api/chat'
import { uploadPaper, getPaper, PaperUploadError } from '../api/papers'
import { appReducer, initialState } from './appReducer'

let counter = 0
function uid(prefix: string) {
  counter += 1
  return `${prefix}_${counter}`
}

const RESEARCH_POLL_MS = 1800
const TOP_SOURCES = 20
const PAPER_POLL_MS = 1500

export function useAppController() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  // keep a live snapshot for callbacks scheduled via setTimeout
  const stateRef = useRef(state)
  stateRef.current = state

  const appendAiTypingThenText = useCallback((text: string, cb?: () => void) => {
    const id = uid('ai')
    dispatch({ type: 'ADD_MESSAGE', message: { kind: 'ai-typing', id } })
    setTimeout(() => {
      dispatch({ type: 'REPLACE_TYPING', id, text })
      if (cb) cb()
    }, 650)
  }, [])

  const populateSourcesProgressively = useCallback(async () => {
    const topic = stateRef.current.topic
    try {
      const found = await searchSources(topic)
      // Chỉ hiển thị TOP_SOURCES bài liên quan nhất; người dùng không cần tự chọn.
      const sources = [...found.sources].sort((a, b) => b.relevance - a.relevance).slice(0, TOP_SOURCES)
      const ids = new Set(sources.map((s) => s.id))
      const relations = found.relations.filter((r) => ids.has(r.source) && ids.has(r.target))
      dispatch({ type: 'SET_SOURCE_RELATIONS', relations })
      // Với ít nguồn, giữ hiệu ứng "xuất hiện từng cái" như cũ (260ms/nguồn) cho mượt.
      // Với nhiều nguồn (vài trăm), gộp thành lô, mỗi lô cách nhau 200ms, để tổng thời
      // gian hiển thị không phụ thuộc tuyến tính vào số lượng (khoảng 8s dù có bao nhiêu).
      const batchSize = Math.max(1, Math.ceil(sources.length / 40))
      const tickDelay = batchSize === 1 ? 260 : 200
      let i = 0
      const addBatch = () => {
        if (i >= sources.length) return
        sources.slice(i, i + batchSize).forEach((source) => dispatch({ type: 'ADD_SOURCE', source }))
        i += batchSize
        setTimeout(addBatch, tickDelay)
      }
      addBatch()
    } catch (err) {
      const message = err instanceof SourceSearchError ? err.message : 'Không tìm được nguồn từ OpenAlex.'
      appendAiTypingThenText(`⚠ ${message}`)
    }
  }, [appendAiTypingThenText])

  const onArticleReady = useCallback(() => {
    dispatch({ type: 'SET_STAGE', stage: 'article' })
    dispatch({ type: 'SET_HEADER', subtitle: 'Bài báo đã sẵn sàng' })
    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        kind: 'ai-text',
        id: uid('ai'),
        text: '✓ Bài báo của bạn đã sẵn sàng. Bạn có thể xem, chỉnh sửa hoặc tiếp tục trò chuyện để tinh chỉnh nội dung.',
      },
    })
    dispatch({ type: 'SET_ACTIVE_TAB', tab: 'article' })
  }, [])

  const runCosmeticProgress = useCallback(
    (progressId: string, steps: string[], onDone: () => void) => {
      let i = 0
      const next = () => {
        if (i >= steps.length) {
          dispatch({ type: 'FINISH_PROGRESS', id: progressId })
          setTimeout(onDone, 400)
          return
        }
        dispatch({ type: 'ADVANCE_PROGRESS', id: progressId })
        i += 1
        setTimeout(next, 500 + Math.random() * 300)
      }
      next()
    },
    [],
  )

  const onResearchComplete = useCallback(() => {
    dispatch({ type: 'SET_STAGE', stage: 'research-complete' })
    const sources = stateRef.current.sources
    const citationCount = stateRef.current.citations.length
    dispatch({ type: 'SET_HEADER', subtitle: `${sources.length} nguồn tham khảo đã tìm thấy` })
    dispatch({ type: 'AUTO_SELECT', ids: sources.map((p) => p.id) })

    appendAiTypingThenText(
      citationCount > 0
        ? `✓ Tôi đã tổng hợp xong báo cáo nghiên cứu, sử dụng ${citationCount} trích dẫn từ kho tài liệu đã lập chỉ mục.\nBạn có thể xem toàn bộ nguồn học thuật liên quan ở Research Sources bên phải.`
        : `✓ Tôi đã tổng hợp xong báo cáo nghiên cứu.\nLưu ý: kho tài liệu nội bộ hiện chưa có trích dẫn phù hợp — hãy tải lên paper liên quan để cải thiện chất lượng báo cáo.`,
      () => {
        dispatch({ type: 'ADD_MESSAGE', message: { kind: 'generate-button', id: uid('gen'), clicked: false } })
      },
    )
  }, [appendAiTypingThenText])

  const pollResearchTask = useCallback(
    (taskId: string, progressId: string) => {
      const tick = async () => {
        try {
          const task = await getResearchTask(taskId)
          if (task.status === 'done') {
            dispatch({ type: 'SET_RESEARCH_RESULT', report: task.report ?? '', citations: task.citations })
            dispatch({ type: 'FINISH_PROGRESS', id: progressId })
            setTimeout(onResearchComplete, 300)
            return
          }
          if (task.status === 'failed') {
            dispatch({ type: 'SET_RESEARCH_ERROR' })
            dispatch({ type: 'FINISH_PROGRESS', id: progressId })
            appendAiTypingThenText(`⚠ Nghiên cứu thất bại: ${task.error ?? 'lỗi không xác định'}.`)
            return
          }
          dispatch({ type: 'ADVANCE_PROGRESS', id: progressId })
          setTimeout(tick, RESEARCH_POLL_MS)
        } catch (err) {
          const message = err instanceof ResearchError ? err.message : 'Không thể kiểm tra trạng thái nghiên cứu.'
          dispatch({ type: 'SET_RESEARCH_ERROR' })
          dispatch({ type: 'FINISH_PROGRESS', id: progressId })
          appendAiTypingThenText(`⚠ ${message}`)
        }
      }
      setTimeout(tick, RESEARCH_POLL_MS)
    },
    [appendAiTypingThenText, onResearchComplete],
  )

  const beginArticleGeneration = useCallback(
    (btnId: string) => {
      dispatch({ type: 'MARK_GENERATE_CLICKED', id: btnId })
      dispatch({ type: 'SET_STAGE', stage: 'generating' })
      dispatch({ type: 'SET_HEADER', subtitle: 'Đang tổng hợp bài báo...' })
      dispatch({ type: 'ADD_MESSAGE', message: { kind: 'ai-text', id: uid('ai'), text: 'Đang tổng hợp bài báo...' } })
      const progressId = uid('progress')
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          kind: 'progress',
          id: progressId,
          progressKey: 'generating',
          steps: generatingSteps,
          activeIndex: -1,
          doneCount: 0,
          finished: false,
        },
      })
      runCosmeticProgress(progressId, generatingSteps, onArticleReady)
    },
    [onArticleReady, runCosmeticProgress],
  )

  const beginResearch = useCallback(() => {
    const taskId = stateRef.current.researchTaskId
    if (!taskId) return
    dispatch({ type: 'SET_STAGE', stage: 'researching' })
    dispatch({ type: 'SET_SOURCES_PANEL_OPEN', open: true })
    dispatch({ type: 'SET_HEADER', subtitle: 'Đang nghiên cứu chủ đề...' })
    dispatch({ type: 'ADD_MESSAGE', message: { kind: 'ai-text', id: uid('ai'), text: 'Đang nghiên cứu chủ đề của bạn...' } })
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
    void populateSourcesProgressively()
    pollResearchTask(taskId, progressId)
  }, [pollResearchTask, populateSourcesProgressively])

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

  const showSpecification = useCallback(() => {
    dispatch({ type: 'ADD_MESSAGE', message: { kind: 'specification', id: uid('spec') } })
  }, [])

  const goToSpecification = useCallback(() => {
    dispatch({ type: 'SET_STAGE', stage: 'specification' })
    appendAiTypingThenText('Cảm ơn bạn! Đây là bản đặc tả nghiên cứu tôi đã tổng hợp:', showSpecification)
  }, [appendAiTypingThenText, showSpecification])

  const submitTopic = useCallback(
    (topic: string) => {
      const trimmed = topic.trim()
      if (!trimmed) return
      dispatch({ type: 'START_TOPIC', topic: trimmed, userMsgId: uid('u'), typingId: uid('ai') })
      appendAiTypingThenText(
        'Tôi đã hiểu chủ đề nghiên cứu của bạn.\nĐể xây dựng một bài báo phù hợp hơn, tôi cần xác định thêm một vài thông tin.',
        async () => {
          try {
            const result = await createResearch(trimmed)
            if (result.kind === 'clarification') {
              dispatch({ type: 'SET_CLARIFICATION_QUESTIONS', questions: result.questions })
              setTimeout(() => askClarify(0), 400)
            } else {
              dispatch({ type: 'SET_RESEARCH_TASK', id: result.task.id })
              setTimeout(goToSpecification, 400)
            }
          } catch (err) {
            const message = err instanceof ResearchError ? err.message : 'Không thể bắt đầu nghiên cứu.'
            appendAiTypingThenText(`⚠ ${message}`)
          }
        },
      )
    },
    [appendAiTypingThenText, askClarify, goToSpecification],
  )

  const answerClarify = useCallback(
    (cardId: string, value: string) => {
      dispatch({ type: 'ANSWER_CLARIFY', cardId, value, userMsgId: uid('u') })

      const nextIndex = stateRef.current.clarificationIndex + 1
      if (nextIndex < stateRef.current.clarificationQuestions.length) {
        setTimeout(() => askClarify(nextIndex), 500)
        return
      }

      setTimeout(async () => {
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
          dispatch({ type: 'SET_RESEARCH_TASK', id: result.task.id })
          goToSpecification()
        } catch (err) {
          const message = err instanceof ResearchError ? err.message : 'Không thể bắt đầu nghiên cứu.'
          appendAiTypingThenText(`⚠ ${message}`)
        }
      }, 450)
    },
    [appendAiTypingThenText, askClarify, goToSpecification],
  )

  const sendChatMessage = useCallback(
    (text: string, model?: string) => {
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
            model,
          })
          dispatch({ type: 'SET_CONVERSATION_ID', id: result.conversationId })
          dispatch({ type: 'REPLACE_TYPING', id, text: result.answer, citations: result.citations })
        } catch (err) {
          const message = err instanceof ChatError ? err.message : 'Không thể liên hệ máy chủ paperai.'
          dispatch({ type: 'REPLACE_TYPING', id, text: `⚠ ${message}` })
        }
      })()
    },
    [],
  )

  const uploadPaperFile = useCallback((file: File) => {
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
              appendAiTypingThenText(`✓ Đã xử lý xong "${status.filename}". Bạn có thể hỏi PaperAI về nội dung tài liệu này.`)
              return
            }
            if (status.status === 'failed') {
              appendAiTypingThenText(`⚠ Xử lý tài liệu thất bại: ${status.error ?? 'lỗi không xác định'}.`)
              return
            }
            setTimeout(poll, PAPER_POLL_MS)
          } catch (err) {
            const message = err instanceof PaperUploadError ? err.message : 'Không thể kiểm tra trạng thái tài liệu.'
            dispatch({ type: 'UPDATE_PAPER_UPLOAD', id: msgId, status: 'failed', error: message })
          }
        }
        setTimeout(poll, PAPER_POLL_MS)
      } catch (err) {
        const message = err instanceof PaperUploadError ? err.message : 'Không thể tải lên tài liệu.'
        dispatch({ type: 'UPDATE_PAPER_UPLOAD', id: msgId, status: 'failed', error: message })
      }
    })()
  }, [appendAiTypingThenText])

  const toggleSelectSource = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_SELECT_SOURCE', id })
  }, [])

  const setSourceFilter = useCallback((filter: SourceFilter) => {
    dispatch({ type: 'SET_SOURCE_FILTER', filter })
  }, [])
  const setSourceSearch = useCallback((value: string) => {
    dispatch({ type: 'SET_SOURCE_SEARCH', value })
  }, [])
  const setSourceSort = useCallback((value: 'relevance' | 'year' | 'citation') => {
    dispatch({ type: 'SET_SOURCE_SORT', value })
  }, [])

  const openPaperModal = useCallback((id: string) => {
    dispatch({ type: 'OPEN_MODAL', id })
  }, [])
  const closePaperModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' })
  }, [])

  const setActiveTab = useCallback((tab: ActiveTab) => {
    dispatch({ type: 'SET_ACTIVE_TAB', tab })
  }, [])

  const toggleSidebarCollapsed = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR_COLLAPSED' })
  }, [])
  const toggleSourcesPanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_SOURCES_PANEL' })
  }, [])

  const useSuggestion = useCallback(
    (text: string) => {
      submitTopic(text)
    },
    [submitTopic],
  )

  const beginResearchFromSpec = useCallback(() => {
    beginResearch()
  }, [beginResearch])

  const beginArticleFromButton = useCallback(
    (btnId: string) => {
      beginArticleGeneration(btnId)
    },
    [beginArticleGeneration],
  )

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
    useSuggestion,
    answerClarify,
    beginResearchFromSpec,
    beginArticleFromButton,
    toggleSelectSource,
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
