import { test, expect, type Page } from '@playwright/test'

async function generateArticle(page: Page) {
  await page.goto('/')

  await page.getByPlaceholder('Hãy mô tả chủ đề bạn muốn nghiên cứu...').fill('Ứng dụng RAG trong chăm sóc khách hàng')
  await page.keyboard.press('Enter')

  // Answer the 3 scripted questions (first option each time). Each question renders its own
  // `.option-group`; earlier ones stay in the DOM but become disabled once answered, so target
  // each new group by index instead of `.first()`.
  const questionGroups = page.locator('.option-group')
  for (let i = 0; i < 3; i++) {
    await expect(questionGroups).toHaveCount(i + 1, { timeout: 10_000 })
    await questionGroups.nth(i).locator('.option-btn').first().click()
  }

  // Specification card -> begin research
  await page.getByRole('button', { name: 'Bắt đầu nghiên cứu' }).click()

  // Research progress -> "Tạo bài báo" button appears once research completes
  const generateBtn = page.getByRole('button', { name: 'Tạo bài báo' })
  await generateBtn.waitFor({ state: 'visible', timeout: 20_000 })
  await generateBtn.click()

  // Article generation progress -> article view renders
  await page.locator('.article-paper').waitFor({ state: 'visible', timeout: 20_000 })
}

test('renders the article as an academic paper with a table and a figure', async ({ page }) => {
  await generateArticle(page)

  const paper = page.locator('.article-paper')
  await expect(paper).toBeVisible()

  // Academic typesetting: serif body font, not the app's default sans-serif UI font.
  const fontFamily = await paper.evaluate((el) => getComputedStyle(el).fontFamily)
  expect(fontFamily.toLowerCase()).toContain('georgia')

  // Title, authors/date meta, and abstract block are present.
  await expect(page.locator('.article-title')).toBeVisible()
  await expect(page.locator('.article-meta')).toBeVisible()
  await expect(page.locator('.article-abstract')).toBeVisible()
  await expect(page.locator('.article-keywords')).toContainText('Keywords:')

  // Numbered sections render.
  await expect(page.locator('.article-section h2').first()).toContainText('1. Introduction')

  // Table support: at least one captioned table with a header row and data rows.
  const table = page.locator('.article-table')
  await expect(table).toBeVisible()
  await expect(page.locator('.article-table-wrap .article-caption')).toContainText('Table 1.')
  await expect(table.locator('thead th')).toHaveCount(4)
  await expect(table.locator('tbody tr')).toHaveCount(3)

  // Chart/figure support: an SVG bar chart with a numbered caption.
  const figure = page.locator('.article-figure-svg')
  await expect(figure).toBeVisible()
  await expect(page.locator('.article-figure-wrap .article-caption')).toContainText('Figure 1.')
  await expect(figure.locator('.article-figure-bar')).toHaveCount(3)

  // References section still works.
  await expect(page.locator('.article-references li').first()).toBeVisible()

  await page.screenshot({ path: 'test-results/article-paper-full.png', fullPage: true })
  await paper.screenshot({ path: 'test-results/article-paper.png' })
})

test('citation click still opens the source modal', async ({ page }) => {
  await generateArticle(page)

  await page.locator('.citation-chip').first().click()
  await expect(page.locator('.ant-modal').first()).toBeVisible()
})
