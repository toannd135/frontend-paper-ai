import { useCallback, useReducer, useRef } from 'react'
import type { ActiveTab, ChatMessage, SourceFilter } from '../../types'
import {
  generatingSteps,
  questions,
  researchingSteps,
} from '../../data/mock'
import { searchSources, SourceSearchError } from '../api/sources'
import { appReducer, initialState } from './appReducer'

let counter = 0
function uid(prefix: string) {
  counter += 1
  return `${prefix}_${counter}`
}

export function useAppController() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  // keep a live snapshot for callbacks scheduled via setTimeout
  const stateRef = useRef(state)
  stateRef.current = state

  const askQuestion = useCallback((index: number) => {
    const q = questions[index]
    if (!q) return
    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        kind: 'question',
        id: uid('q'),
        questionId: q.id,
        prompt: q.prompt,
        options: q.options,
        answered: false,
        selectedIndex: null,
      },
    })
  }, [])

  const showSpecification = useCallback(() => {
    dispatch({ type: 'ADD_MESSAGE', message: { kind: 'specification', id: uid('spec') } })
  }, [])

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
      const { sources, relations } = await searchSources(topic)
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

  const runProgressSequence = useCallback(
    (progressId: string, steps: string[], onDone: () => void, populateSourcesMidway: boolean) => {
      let i = 0
      const next = () => {
        if (i > 0) {
          // previous step marked done automatically by activeIndex advancing in reducer
        }
        if (i >= steps.length) {
          dispatch({ type: 'FINISH_PROGRESS', id: progressId })
          setTimeout(onDone, 400)
          return
        }
        dispatch({ type: 'ADVANCE_PROGRESS', id: progressId })
        if (populateSourcesMidway && i === 2) {
          void populateSourcesProgressively()
        }
        i += 1
        setTimeout(next, 900 + Math.random() * 500)
      }
      next()
    },
    [populateSourcesProgressively],
  )

  const onResearchComplete = useCallback(() => {
    dispatch({ type: 'SET_STAGE', stage: 'research-complete' })
    const sources = stateRef.current.sources
    dispatch({ type: 'SET_HEADER', subtitle: `${sources.length} nguồn đã tìm thấy` })
    const top8 = [...sources].sort((a, b) => b.relevance - a.relevance).slice(0, 8)
    dispatch({ type: 'AUTO_SELECT', ids: top8.map((p) => p.id) })

    appendAiTypingThenText(
      `✓ Tôi đã tìm được ${sources.length} nguồn phù hợp.\nTôi đã phân tích và xếp hạng các nguồn theo mức độ liên quan đến chủ đề nghiên cứu.\nBạn có thể xem toàn bộ nguồn ở Research Sources bên phải.\nTôi đã chọn ${top8.length} nguồn phù hợp nhất để sử dụng trong bài báo.`,
      () => {
        dispatch({ type: 'ADD_MESSAGE', message: { kind: 'generate-button', id: uid('gen'), clicked: false } })
      },
    )
  }, [appendAiTypingThenText])

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
      runProgressSequence(progressId, generatingSteps, onArticleReady, false)
    },
    [onArticleReady, runProgressSequence],
  )

  const beginResearch = useCallback(
    (specMsgId: string) => {
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
      runProgressSequence(progressId, researchingSteps, onResearchComplete, true)
      void specMsgId
    },
    [onResearchComplete, runProgressSequence],
  )

  const selectOption = useCallback(
    (cardId: string, questionId: string, optIndex: number) => {
      const q = questions.find((qq) => qq.id === questionId)
      if (!q) return
      const value = q.options[optIndex]
      dispatch({ type: 'ANSWER_QUESTION', cardId, questionId, selectedIndex: optIndex, value, userMsgId: uid('u') })

      const nextIndex = stateRef.current.questionIndex + 1
      if (nextIndex < questions.length) {
        setTimeout(() => askQuestion(nextIndex), 500)
      } else {
        setTimeout(() => {
          dispatch({ type: 'SET_STAGE', stage: 'specification' })
          appendAiTypingThenText('Cảm ơn bạn! Đây là bản đặc tả nghiên cứu tôi đã tổng hợp:', showSpecification)
        }, 450)
      }
    },
    [appendAiTypingThenText, askQuestion, showSpecification],
  )

  const submitTopic = useCallback(
    (topic: string) => {
      const trimmed = topic.trim()
      if (!trimmed) return
      dispatch({ type: 'START_TOPIC', topic: trimmed, userMsgId: uid('u'), typingId: uid('ai') })
      appendAiTypingThenText(
        'Tôi đã hiểu chủ đề nghiên cứu của bạn.\nĐể xây dựng một bài báo phù hợp hơn, tôi cần xác định thêm một vài thông tin.',
        () => setTimeout(() => askQuestion(0), 400),
      )
    },
    [appendAiTypingThenText, askQuestion],
  )

  const sendChatMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      dispatch({ type: 'ADD_MESSAGE', message: { kind: 'user', id: uid('u'), text: trimmed } })
      appendAiTypingThenText(
        'Đã ghi nhận yêu cầu của bạn. Trong bản demo này, phản hồi được mô phỏng — ở phiên bản đầy đủ PaperAI sẽ cập nhật bài báo hoặc nguồn tương ứng.',
      )
    },
    [appendAiTypingThenText],
  )

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

  const flashHighlightSource = useCallback((id: string) => {
    dispatch({ type: 'FLASH_SOURCE', id })
    setTimeout(() => dispatch({ type: 'FLASH_SOURCE', id: null }), 1500)
  }, [])

  const onCitationClick = useCallback(
    (sourceId: string) => {
      openPaperModal(sourceId)
      setTimeout(() => flashHighlightSource(sourceId), 350)
    },
    [flashHighlightSource, openPaperModal],
  )

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

  const beginResearchFromSpec = useCallback(
    (btnId: string) => {
      void btnId
      beginResearch(btnId)
    },
    [beginResearch],
  )

  const beginArticleFromButton = useCallback(
    (btnId: string) => {
      beginArticleGeneration(btnId)
    },
    [beginArticleGeneration],
  )

  const chatMessages: ChatMessage[] = state.messages

  return {
    state,
    chatMessages,
    submitTopic,
    useSuggestion,
    selectOption,
    beginResearchFromSpec,
    beginArticleFromButton,
    toggleSelectSource,
    setSourceFilter,
    setSourceSearch,
    setSourceSort,
    openPaperModal,
    closePaperModal,
    onCitationClick,
    setActiveTab,
    sendChatMessage,
    toggleSidebarCollapsed,
    toggleSourcesPanel,
  }
}

export type AppController = ReturnType<typeof useAppController>
