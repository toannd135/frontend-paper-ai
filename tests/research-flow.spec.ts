import { test, expect, type Page, type Route } from '@playwright/test'

/**
 * E2E luồng nghiên cứu với backend được mock qua page.route — không cần FastAPI/LLM thật.
 * Kịch bản: chủ đề -> 1 câu hỏi làm rõ -> spec -> research (poll 2 lần) -> báo cáo -> Article view
 * render bảng, công thức KaTeX, biểu đồ chart và trích dẫn.
 */

const TASK_ID = 'task-e2e-0001'

const REPORT = `# DemoRAG: A Study

**Authors:** PaperAI Automated Research Protocol | **Affiliations:** Open-Source Automated Science Initiative

## Abstract
Hybrid retrieval combines BM25 and dense vectors.

**Keywords:** RAG, retrieval, evaluation

## 1. Introduction
Dense retrieval improves recall [1]. Sparse retrieval remains strong on exact terms [2].

## 2. Method
The score is $s = \\alpha v + \\beta b$ where

$$
s_i = \\alpha \\cdot \\hat v_i + \\beta \\cdot \\hat b_i
$$

**Table 1: Benchmark comparison**
| Method | Recall@5 |
|---|---|
| BM25 | 0.61 |
| Hybrid | **0.78** |

\`\`\`chart
{"type": "bar", "caption": "Recall by method", "labels": ["BM25", "Hybrid"], "series": [{"name": "Recall@5", "values": [0.61, 0.78]}]}
\`\`\`

## References
[1] paper-a, Page: 3
[2] paper-b, Page: 1
`

const CITATIONS = [
  { paper_id: 'paper-a', chunk_id: 'c1', page: 3, section: 'Method', text_snippet: 'Dense retrieval improves recall.' },
  { paper_id: 'paper-b', chunk_id: 'c2', page: 1, section: 'Intro', text_snippet: 'Sparse retrieval remains strong.' },
]

async function mockBackend(page: Page) {
  let polls = 0
  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

  await page.route('**/api/chat/models', (route) =>
    json(route, [{ id: 'gemini-3.6-flash', label: 'Google · Gemini 3.6 Flash', available: true }]),
  )
  await page.route('**/api/research?*', (route) => json(route, { items: [], total: 0, limit: 100, offset: 0 }))
  await page.route('**/api/research/', async (route) => {
    const body = route.request().postDataJSON() as { clarification_answers?: Record<string, string> }
    if (!body.clarification_answers) {
      return json(route, {
        status: 'needs_clarification',
        questions: [{ text: 'Bạn muốn tổng quan hay đề xuất phương pháp mới?', suggestions: ['Tổng quan', 'Phương pháp mới'] }],
      })
    }
    return json(route, {
      id: TASK_ID,
      question: 'Ứng dụng RAG trong chăm sóc khách hàng',
      refined_question: 'Tổng quan RAG trong chăm sóc khách hàng',
      status: 'pending',
      report: null,
      citations: [],
      error: null,
      created_at: new Date().toISOString(),
    })
  })
  await page.route(`**/api/research/${TASK_ID}`, (route) => {
    polls += 1
    const done = polls >= 2
    return json(route, {
      id: TASK_ID,
      question: 'Ứng dụng RAG trong chăm sóc khách hàng',
      refined_question: null,
      status: done ? 'done' : 'processing',
      report: done ? REPORT : null,
      citations: done ? CITATIONS : [],
      error: null,
      created_at: new Date().toISOString(),
    })
  })
  await page.route('**/api/sources/search?*', (route) =>
    json(route, {
      sources: [
        { id: 'W1', title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP', authors: 'Lewis et al.', year: 2020, publisher: 'NeurIPS', type: 'Article', doi: '10.1/x', relevance: 97, citations: 5000, abstract: 'We explore RAG.' },
        { id: 'W2', title: 'Dense Passage Retrieval', authors: 'Karpukhin et al.', year: 2020, publisher: 'EMNLP', type: 'Article', doi: '', relevance: 80, citations: 3000, abstract: null },
      ],
      relations: [{ source: 'W1', target: 'W2', kind: 'cites' }],
    }),
  )
}

async function runResearch(page: Page) {
  await mockBackend(page)
  await page.goto('/')

  await page.getByPlaceholder('Hãy mô tả chủ đề bạn muốn nghiên cứu...').fill('Ứng dụng RAG trong chăm sóc khách hàng')
  await page.keyboard.press('Enter')

  // Câu hỏi làm rõ từ backend mock -> chọn gợi ý đầu tiên
  const group = page.locator('.option-group').first()
  await expect(group).toBeVisible({ timeout: 10_000 })
  await group.locator('.option-btn').first().click()

  // Specification card -> bắt đầu nghiên cứu
  await page.getByRole('button', { name: 'Bắt đầu nghiên cứu' }).click()

  // Poll 2 lần (2.5s/lần) rồi hiện nút xem bài báo
  const viewBtn = page.getByRole('button', { name: 'Xem bài báo' })
  await viewBtn.waitFor({ state: 'visible', timeout: 20_000 })
  await viewBtn.click()
  await page.getByTestId('article-paper').waitFor({ state: 'visible', timeout: 10_000 })
}

test('research flow renders a rich academic article from the backend report', async ({ page }) => {
  await runResearch(page)
  const paper = page.getByTestId('article-paper')

  await expect(paper.locator('.article-title')).toHaveText('DemoRAG: A Study')
  await expect(paper.locator('.article-abstract')).toContainText('Hybrid retrieval')
  await expect(paper.locator('.article-keywords')).toContainText('Keywords:')
  await expect(paper.locator('.article-h2').first()).toContainText('1. Introduction')

  // Bảng GFM có caption tự đánh số
  await expect(paper.locator('.article-table')).toBeVisible()
  await expect(paper.locator('.article-caption-table')).toContainText('Bảng 1.')
  await expect(paper.locator('.article-caption-table')).toContainText('Benchmark comparison')
  await expect(paper.locator('.article-table tbody tr')).toHaveCount(2)

  // Công thức KaTeX (inline + display)
  await expect(paper.locator('.katex').first()).toBeVisible()
  await expect(paper.locator('.katex-display')).toHaveCount(1)

  // Biểu đồ từ khối ```chart``` -> SVG + caption
  await expect(paper.locator('.article-figure-svg')).toBeVisible()
  await expect(paper.locator('.article-figure-wrap .article-caption')).toContainText('Hình 1.')

  // Trích dẫn IEEE + danh mục tham khảo từ citations thật
  await expect(paper.locator('.citation-group').first()).toContainText('[1]')
  await expect(paper.locator('.article-references li')).toHaveCount(2)
  await expect(paper.locator('#ref-c1')).toContainText('paper-a')

  // Mục References do backend nối thêm bị ẩn (render có cấu trúc thay thế)
  await expect(paper.locator('.article-h2', { hasText: 'References' })).toHaveCount(0)

  // Toolbar: xuất PDF thật trỏ tới endpoint backend, không còn nút giả
  await expect(page.getByRole('button', { name: 'Xuất PDF' })).toBeEnabled()
  await expect(page.getByRole('button', { name: /Export DOCX|Share|Regenerate/ })).toHaveCount(0)
})

test('research sources panel and graph tab are populated from OpenAlex mock', async ({ page }) => {
  await runResearch(page)
  await expect(page.locator('.sources-count-badge')).toHaveText('2', { timeout: 10_000 })
  await page.getByRole('tab', { name: 'Graph' }).click()
  await expect(page.locator('.graph-view')).toBeVisible()
  await page.getByRole('tab', { name: 'Article' }).click()
  await expect(page.getByTestId('article-paper')).toBeVisible()
})

test('shows a clear error bubble when backend is unreachable', async ({ page }) => {
  await page.route('**/api/research?*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[],"total":0}' }))
  await page.route('**/api/research/', (route) => route.abort('connectionrefused'))
  await page.goto('/')
  await page.getByPlaceholder('Hãy mô tả chủ đề bạn muốn nghiên cứu...').fill('Một chủ đề bất kỳ')
  await page.keyboard.press('Enter')
  await expect(page.locator('.bubble.ai.tone-error')).toContainText('Không thể kết nối', { timeout: 10_000 })
})
