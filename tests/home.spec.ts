import { test, expect, type Page, type Route } from '@playwright/test'

/** E2E trang /home với backend mock qua page.route — không cần FastAPI/LLM thật. */

const SHOTS = process.env.HOME_SHOTS_DIR ?? 'test-results/home'

const USER = { id: 'u1', email: 'an@example.com', full_name: 'Nguyễn Văn An', role: 'user', is_active: true }

const RECENT = [
  {
    id: 'task-1',
    question: 'Hãy viết bài báo khoa học về ứng dụng RAG trong giáo dục đại học tại Việt Nam và các thách thức triển khai',
    refined_question: null,
    status: 'done',
    has_report: true,
    citation_count: 12,
    error: null,
    created_at: '2026-10-20T08:00:00Z',
  },
  {
    id: 'task-2',
    question: 'AI trong phát hiện gian lận',
    refined_question: null,
    status: 'processing',
    has_report: false,
    citation_count: 0,
    error: null,
    created_at: '2026-10-21T08:00:00Z',
  },
]

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

async function setup(page: Page, list: () => { status: number; body: unknown }) {
  await page.addInitScript(() => {
    localStorage.setItem('paperai.token', 'test-token')
    localStorage.setItem('paperai-theme', window.localStorage.getItem('paperai-theme') ?? 'light')
  })
  await page.route('**/api/auth/me', (route) => json(route, USER))
  await page.route('**/api/chat/models', (route) => json(route, []))
  await page.route('**/api/research?*', (route) => {
    const { status, body } = list()
    return json(route, body, status)
  })
}

const okList = () => ({ status: 200, body: { items: RECENT, total: RECENT.length, limit: 5, offset: 0 } })

test('khách thấy landing page: không có ô nhập, không có "gần đây", header gọn', async ({ page }) => {
  let listed = 0
  await page.route('**/api/research?*', (route) => {
    listed += 1
    return json(route, { items: [], total: 0 })
  })
  await page.goto('/home')
  await expect(page).toHaveURL(/\/home$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('PaperAI')
  await expect(page.getByLabel('Chủ đề nghiên cứu')).toHaveCount(0)
  await expect(page.getByText('Tiếp tục gần đây')).toHaveCount(0)
  await expect(page.getByText('Đăng nhập để xem và tiếp tục')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Điều hướng chính' }).getByRole('link', { name: 'Nghiên cứu' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /Bạn có thể làm gì/ })).toBeVisible()
  expect(listed).toBe(0)

  await page.getByRole('link', { name: 'Bắt đầu nghiên cứu' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Tạo tài khoản' })).toBeVisible()
})

for (const width of [375, 768, 1440]) {
  test(`landing page khách ở ${width}px không tràn ngang`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/home')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('.lp button, .lp-nav a, .lp-btn, .lp-brand')]
        .map((el) => (el as HTMLElement).getBoundingClientRect())
        .filter((r) => r.width > 0 && (r.height < 43.5 || r.width < 43.5)).length,
    )
    expect(small).toBe(0)
    await page.screenshot({ path: `${SHOTS}/landing-${width}.png`, fullPage: true })
  })
}

test('mở gốc / tự chuyển về /home', async ({ page }) => {
  await setup(page, okList)
  await page.goto('/')
  await expect(page).toHaveURL(/\/home$/)
  await page.goto('/duong-dan-la')
  await expect(page).toHaveURL(/\/home$/)
})

test('đã đăng nhập vẫn thấy landing page, kêu gọi dẫn vào không gian làm việc', async ({ page }) => {
  await setup(page, okList)
  await page.goto('/home')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('PaperAI')
  await expect(page.getByLabel('Chủ đề nghiên cứu')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Đăng nhập' })).toHaveCount(0)
  const enter = page.getByRole('link', { name: 'Vào không gian làm việc' }).first()
  await expect(enter).toBeVisible()
  await page.getByRole('link', { name: 'Bắt đầu nghiên cứu' }).click()
  await expect(page).toHaveURL(/\/workspace$/)
})

test('ba khung demo "Vì sao" cao bằng nhau và tiêu đề section căn giữa', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/home')
  const heights = await page.$$eval('.lp-why-visual', (els) => els.map((e) => Math.round(e.getBoundingClientRect().height)))
  expect(heights).toHaveLength(3)
  expect(new Set(heights).size).toBe(1)
  for (const id of ['lp-features', 'lp-why']) {
    expect(await page.locator(`#${id}`).evaluate((e) => getComputedStyle(e).textAlign)).toBe('center')
  }
})
