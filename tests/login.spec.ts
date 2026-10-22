import { test, expect } from '@playwright/test'

/** Trang đăng nhập: chữ phải đọc được ở cả giao diện sáng và tối (tỉ lệ tương phản WCAG AA 4.5:1). */

const SHOTS = process.env.HOME_SHOTS_DIR ?? 'test-results/home'

for (const theme of ['light', 'dark'] as const) {
  test(`form đăng nhập đủ tương phản ở giao diện ${theme}`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('paperai-theme', t), theme)
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible()

    await page.waitForTimeout(600) // chờ hiệu ứng chuyển màu nền của ô input (0.3s)
    const ratios = await page.evaluate(() => {
      const parse = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 4).map(Number)
      const lum = ([r, g, b]: number[]) => {
        const f = (v: number) => {
          const x = v / 255
          return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
      }
      const bgOf = (el: Element | null): number[] => {
        for (let e = el; e; e = e.parentElement) {
          const c = parse(getComputedStyle(e).backgroundColor)
          if (c.length === 3 || (c.length === 4 && c[3] > 0.99)) return c
        }
        return [255, 255, 255]
      }
      const ratio = (el: Element) => {
        const fg = lum(parse(getComputedStyle(el).color))
        const bg = lum(bgOf(el))
        const [hi, lo] = fg > bg ? [fg, bg] : [bg, fg]
        return (hi + 0.05) / (lo + 0.05)
      }
      const pick = (sel: string) => [...document.querySelectorAll(sel)].map((e) => ratio(e))
      return {
        heading: pick('.auth-card h2'),
        sub: pick('.auth-sub'),
        labels: pick('.auth-card label'),
        inputs: pick('.auth-card input'),
      }
    })

    for (const [name, list] of Object.entries(ratios)) {
      expect(list.length, name).toBeGreaterThan(0)
      for (const r of list) expect(r, `${name} ${r.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
    }
    await page.screenshot({ path: `${SHOTS}/login-${theme}.png` })
  })
}
