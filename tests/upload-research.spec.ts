import { test, expect, type Page, type Route } from '@playwright/test'

/** Luồng "Dùng bài báo của tôi" với backend mock: PDF -> workspace -> research chỉ trên PDF. */

const TASK_ID = 'task-upload-0001'
const WORKSPACE_ID = 'ws-0001'
const pdf = (name: string) => ({ name, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('paperai.token', 'test-token'))
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { id: 'u1', email: 'a@example.com', full_name: 'Test', role: 'user' } }),
  )
})

async function mockBackend(page: Page, finalPaperStatus: 'done' | 'failed' = 'done') {
  const seen = { researchBodies: [] as Record<string, unknown>[], uploads: [] as string[], openAlexCalls: 0 }
  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
  const task = (status: string) => ({
    id: TASK_ID, question: 'Đề tài', refined_question: null, status, report: status === 'done' ? '# Bài\n\nNội dung.' : null,
    citations: [], error: null, created_at: new Date().toISOString(), workspace_id: WORKSPACE_ID,
  })

  await page.route('**/api/chat/models', (route) => json(route, []))
  await page.route('**/api/research?*', (route) => json(route, { items: [], total: 0, limit: 100, offset: 0 }))
  await page.route('**/api/workspaces', (route) => json(route, { id: WORKSPACE_ID }, 201))
  await page.route('**/api/papers/upload*', (route) => {
    seen.uploads.push(route.request().url())
    return json(route, { id: 'p1', filename: 'mine.pdf', status: 'pending' }, 201)
  })
  await page.route('**/api/papers/p1', (route) => json(route, { id: 'p1', filename: 'mine.pdf', status: finalPaperStatus, error: null }))
  await page.route('**/api/papers?*', (route) =>
    json(route, { items: [{ id: 'p1', filename: 'mine.pdf', status: 'done', error: null }], total: 1 }),
  )
  await page.route('**/api/research/', (route) => {
    seen.researchBodies.push(route.request().postDataJSON() as Record<string, unknown>)
    return json(route, task('pending'))
  })
  await page.route(`**/api/research/${TASK_ID}`, (route) => json(route, task('processing')))
  await page.route('**/api/sources/search?*', (route) => {
    seen.openAlexCalls += 1
    return json(route, { sources: [], relations: [] })
  })
  return seen
}

async function fillTopic(page: Page) {
  await page.goto('/workspace')
  await page.getByLabel('Chủ đề nghiên cứu').fill('Đề tài của tôi')
}

test('research dùng PDF tải lên: gửi workspace, không gọi OpenAlex, panel hiện đúng PDF', async ({ page }) => {
  const seen = await mockBackend(page)
  await fillTopic(page)
  await page.getByLabel('Nơi nộp bài').selectOption('ieee')

  await page.getByRole('radio', { name: 'Dùng bài báo của tôi' }).click()
  const send = page.getByRole('button', { name: 'Gửi' })
  await expect(send).toBeDisabled()

  await page.getByTestId('research-papers-input').setInputFiles([pdf('mine.pdf')])
  await expect(page.locator('.paper-picker-list li')).toHaveCount(1)
  await send.click()

  await page.getByRole('button', { name: 'Bắt đầu nghiên cứu' }).click({ timeout: 15_000 })
  await expect(page.locator('.sources-count-badge')).toHaveText('1', { timeout: 10_000 })
  await expect(page.locator('.source-badge')).toHaveText('PDF của bạn')

  expect(seen.uploads[0]).toContain(`workspace_id=${WORKSPACE_ID}`)
  expect(seen.researchBodies[0]).toMatchObject({ workspace_id: WORKSPACE_ID, target_venue: 'IEEE (IEEEtran)' })
  expect(seen.researchBodies[0]).not.toHaveProperty('venue')
  expect(seen.openAlexCalls).toBe(0)
})

test('mọi PDF đều lỗi thì không tạo research', async ({ page }) => {
  const seen = await mockBackend(page, 'failed')
  await fillTopic(page)
  await page.getByRole('radio', { name: 'Dùng bài báo của tôi' }).click()
  await page.getByTestId('research-papers-input').setInputFiles([pdf('bad.pdf')])
  await page.getByRole('button', { name: 'Gửi' }).click()

  await expect(page.getByText('Không có PDF nào xử lý được')).toBeVisible({ timeout: 10_000 })
  expect(seen.researchBodies).toHaveLength(0)
})

test('chế độ mặc định không gửi workspace', async ({ page }) => {
  const seen = await mockBackend(page)
  await fillTopic(page)
  await page.keyboard.press('Enter')
  await expect.poll(() => seen.researchBodies.length, { timeout: 10_000 }).toBe(1)
  expect(seen.researchBodies[0]).not.toHaveProperty('workspace_id')
  expect(seen.uploads).toHaveLength(0)
})
