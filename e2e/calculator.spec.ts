import { test, expect, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const storageKey = 'buy-or-rent-scenario-v5'
async function open(page: Page, url = '/') {
  await page.goto(url)
  await expect(page.locator('main')).toHaveAttribute('data-ready', 'true')
}
async function expand(page: Page) {
  await page.getByRole('button', { name: 'Fine-tune assumptions' }).click()
  for (const group of await page.locator('.advanced-content > details > summary').all()) await group.click()
  await expect(page.getByLabel('Gross room / ADU rent', { exact: true })).toBeVisible()
}
async function saved(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), storageKey)
}

test('renders the comparison, chart, and detailed controls without runtime errors', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await open(page)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Should you buy')
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('750000')
  await expect(page.locator('.recharts-area-curve')).toHaveCount(2)
  await page.screenshot({ scale: 'css', path: testInfo.outputPath('01-essentials.png'), fullPage: true })
  await page.locator('.verdict').scrollIntoViewIfNeeded()
  await page.screenshot({ scale: 'css', path: testInfo.outputPath('05-results-viewport.png'), fullPage: false })
  await expand(page)
  await page.getByText('See the year-by-year comparison', { exact: true }).click()
  await expect(page.locator('tbody tr')).toHaveCount(10)
  await page.screenshot({ scale: 'css', path: testInfo.outputPath('02-assumptions.png'), fullPage: true })
  expect(errors).toEqual([])
})

test('passes automated WCAG checks in the expanded calculator and share dialog', async ({ page }, testInfo) => {
  await open(page)
  await expand(page)
  await page.getByText('See the year-by-year comparison', { exact: true }).click()
  for (const state of ['calculator', 'dialog']) {
    if (state === 'dialog') await page.getByRole('button', { name: 'Share scenario', exact: true }).click()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
    await testInfo.attach(`accessibility-${state}`, { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' })
    expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([])
  }
})

test('updates the result, saves edits, and restores them on reload', async ({ page }) => {
  await open(page)
  const old = await page.locator('.verdict h2').innerText()
  await page.getByLabel('Home price', { exact: true }).fill('950000')
  await page.getByLabel('Home price', { exact: true }).blur()
  await expect(page.locator('.verdict h2')).not.toHaveText(old)
  await expect.poll(async () => (await saved(page)).homePrice).toBe(950000)
  await page.reload()
  await expect(page.locator('main')).toHaveAttribute('data-ready', 'true')
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('950000')
})

test('allows clearing and replacing numbers, then displays the actual clamped value', async ({ page }) => {
  await open(page)
  const price = page.getByLabel('Home price', { exact: true })
  await price.fill('')
  await expect(price).toHaveValue('')
  await price.fill('620000')
  await price.blur()
  await expect(price).toHaveValue('620000')
  const rent = page.getByLabel('Monthly rent', { exact: true })
  await rent.fill('0')
  await rent.blur()
  await expect(rent).toHaveValue('100')
  await expect(page.locator('.results-panel')).not.toContainText('Infinity')
  await price.fill('')
  await price.blur()
  await expect(price).toHaveValue('620000')
})

test('switches all financing programs, restoring mortgage inputs after cash', async ({ page }) => {
  await open(page)
  const financing = page.getByLabel('Purchase financing')
  for (const [type, down] of [['conventional', '20'], ['fha', '3.5'], ['va', '0']]) {
    await financing.selectOption('cash')
    await expect(page.getByLabel('Down payment', { exact: true })).toHaveValue('100')
    await expect(page.getByLabel('Mortgage rate', { exact: true })).toBeDisabled()
    await financing.selectOption(type)
    await expect(page.getByLabel('Down payment', { exact: true })).toHaveValue(down)
    await expect(page.getByLabel('Mortgage rate', { exact: true })).toHaveValue('6.5')
    await expect(page.getByLabel('Mortgage rate', { exact: true })).toBeEnabled()
  }
})

test('loads state assumptions and applies market presets', async ({ page }) => {
  await open(page)
  await expand(page)
  const before = (await saved(page)).propertyTaxRate
  await page.getByRole('combobox', { name: 'State', exact: true }).selectOption('TX')
  await expect.poll(async () => (await saved(page)).state).toBe('TX')
  expect((await saved(page)).propertyTaxRate).not.toBe(before)
  for (const [label, growth] of [['Cautious', 1.5], ['Balanced', 3], ['Growth', 4.5]] as const) {
    await page.getByRole('button', { name: label, exact: true }).click()
    await expect(page.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(async () => (await saved(page)).homeAppreciation).toBe(growth)
  }
})

test('applies rental income, tax controls, and fractional year totals', async ({ page }, testInfo) => {
  await open(page, '/?stayYears=1.5')
  await expand(page)
  const old = await page.locator('.verdict h2').innerText()
  await page.getByLabel('Gross room / ADU rent', { exact: true }).fill('2000')
  await page.getByLabel('Gross room / ADU rent', { exact: true }).blur()
  await expect(page.locator('.verdict h2')).not.toHaveText(old)
  await page.getByRole('combobox', { name: 'Filing status', exact: true }).selectOption('single')
  await page.getByLabel('Annual income / MAGI', { exact: true }).fill('1000000')
  await page.getByLabel('Annual income / MAGI', { exact: true }).blur()
  await expect(page.getByLabel('SALT deduction cap', { exact: true })).toHaveValue('10000')
  await expect(page.getByLabel('SALT deduction cap', { exact: true })).toBeDisabled()
  await page.getByRole('checkbox', { name: 'Use current-law SALT caps' }).uncheck()
  await page.getByLabel('SALT deduction cap', { exact: true }).fill('15000')
  await page.getByLabel('SALT deduction cap', { exact: true }).blur()
  await expect.poll(async () => (await saved(page)).saltDeductionCap).toBe(15000)
  await page.getByText('See the year-by-year comparison', { exact: true }).click()
  await expect(page.locator('tbody tr')).toHaveCount(2)
  await expect(page.locator('tbody tr').last()).toContainText('1.5 (partial)')
  await expect(page.getByRole('columnheader', { name: 'Net room / ADU' })).toBeVisible()
  await page.screenshot({ scale: 'css', path: testInfo.outputPath('03-rental-and-tax.png'), fullPage: true })
})

test('recovers from corrupt storage and malicious enum names', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, '{invalid json'), storageKey)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await open(page, '/?filingStatus=constructor&loanType=__proto__&state=toString&homePrice=bad')
  await expand(page)
  await expect(page.getByRole('combobox', { name: 'Filing status', exact: true })).toHaveValue('marriedJoint')
  await expect(page.getByLabel('Purchase financing')).toHaveValue('conventional')
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('750000')
  expect(errors).toEqual([])
})

test('normalizes a damaged saved scenario without crashing', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, JSON.stringify({ filingStatus: 'constructor', zipCode: 90210, homePrice: 'bad', monthlyRent: 0 })), storageKey)
  await open(page)
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('750000')
  await expect(page.getByLabel('Monthly rent', { exact: true })).toHaveValue('100')
  await expect(page.getByLabel('ZIP code')).toHaveValue('')
})

test('works when browser storage is blocked', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError') } }))
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await open(page)
  await expect(page.getByText('Saving is unavailable in this browser.', { exact: false })).toBeVisible()
  await page.getByLabel('Home price', { exact: true }).fill('900000')
  await page.getByLabel('Home price', { exact: true }).blur()
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('900000')
  expect(errors).toEqual([])
})

test('reports storage quota failures without losing calculation functionality', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError') } })
  await open(page)
  await expect(page.getByText('Saving is unavailable in this browser.', { exact: false })).toBeVisible()
  await page.getByLabel('Home price', { exact: true }).fill('900000')
  await expect(page.locator('.verdict h2')).not.toBeEmpty()
})

test('preserves saved inputs when opening a shared link and ignores tracking queries', async ({ page }) => {
  await open(page)
  await page.getByLabel('Home price', { exact: true }).fill('850000')
  await expect.poll(async () => (await saved(page)).homePrice).toBe(850000)
  await open(page, '/?utm_source=test')
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('850000')
  await open(page, '/#scenario=homePrice=450000')
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('450000')
  expect((await saved(page)).homePrice).toBe(850000)
  await page.getByRole('button', { name: 'Return to my saved scenario' }).click()
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('850000')
  expect(new URL(page.url()).hash).toBe('')
})

test('copies a disclosed fragment link and restores the same scenario from it', async ({ page, context }, testInfo) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text: string) => { (window as unknown as { copiedLink: string }).copiedLink = text } } }))
  await open(page)
  await page.getByLabel('Home price', { exact: true }).fill('555000')
  await page.getByRole('button', { name: 'Share scenario', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('including income and ZIP code')
  await page.getByRole('button', { name: 'Copy link', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('Link copied')
  const link = await page.evaluate(() => (window as unknown as { copiedLink: string }).copiedLink)
  expect(new URL(link).search).toBe('')
  expect(new URL(link).hash).toContain('#scenario=')
  await page.screenshot({ scale: 'css', path: testInfo.outputPath('04-sharing.png'), fullPage: false })
  const other = await context.newPage()
  await open(other, link)
  await expect(other.getByLabel('Home price', { exact: true })).toHaveValue('555000')
  await other.close()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('750000')
})

test('handles clipboard failure and native share cancellation without copying', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Clipboard denied') } } })
    Object.defineProperty(navigator, 'share', { value: async () => { throw new DOMException('Cancelled', 'AbortError') } })
  })
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await open(page)
  await page.getByRole('button', { name: 'Share scenario', exact: true }).click()
  await page.getByRole('button', { name: 'Share via device' }).click()
  await expect(page.getByRole('dialog').getByRole('status')).toBeEmpty()
  await page.getByRole('button', { name: 'Copy link', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('status')).toContainText('copy it manually')
  await expect(page.getByLabel('Scenario link', { exact: true })).toHaveValue(/#scenario=/)
  expect(errors).toEqual([])
})

test('supports help with keyboard and avoids horizontal page overflow', async ({ page }) => {
  await open(page)
  await expand(page)
  const tip = page.getByRole('button', { name: 'More information about Down payment', exact: true })
  await tip.focus()
  await page.keyboard.press('Enter')
  await expect(tip).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Escape')
  await expect(tip).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('tooltip', { includeHidden: true }).first()).toHaveCSS('opacity', '0')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
  expect(overflow).toBe(false)
  const ids = await page.locator('[id]').evaluateAll((nodes) => nodes.map((n) => n.id))
  expect(new Set(ids).size).toBe(ids.length)
})

test('serves deployment metadata and excludes analytics requests', async ({ page, request }) => {
  const external: string[] = []
  page.on('request', (r) => { if (!new URL(r.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/)) external.push(r.url()) })
  await open(page)
  await expect(page).toHaveTitle('Buy or Rent? Make the Call With Better Math')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/example\.com\/?$/)
  const response = await request.get('/')
  expect(response.headers()['referrer-policy']).toBe('no-referrer')
  expect(response.headers()['x-content-type-options']).toBe('nosniff')
  expect((await (await request.get('/robots.txt')).text())).toContain('https://example.com/sitemap.xml')
  expect((await (await request.get('/sitemap.xml')).text())).toContain('https://example.com')
  expect(external).toEqual([])
})


test('edits and reloads shared inputs without reverting to the old link', async ({ page }) => {
  await open(page, '/#scenario=homePrice=450000')
  await page.getByLabel('Home price', { exact: true }).fill('625000')
  await page.getByLabel('Home price', { exact: true }).blur()
  await expect.poll(async () => (await saved(page)).homePrice).toBe(625000)
  expect(new URL(page.url()).hash).toBe('')
  await page.reload()
  await expect(page.locator('main')).toHaveAttribute('data-ready', 'true')
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('625000')
  await page.evaluate(() => { location.hash = 'scenario=homePrice=475000' })
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('475000')
  expect((await saved(page)).homePrice).toBe(625000)
})


test('keeps every help panel inside the horizontal viewport', async ({ page }) => {
  test.slow() // This sweep exercises every advanced control, including on shared CI runners.
  await open(page)
  await expand(page)
  const buttons = page.locator('.info-tip-button')
  for (let i = 0; i < await buttons.count(); i++) {
    const button = buttons.nth(i)
    await button.click()
    const tip = button.locator('..').locator('.info-tip-content')
    await expect(tip).toBeVisible()
    const bounds = await tip.boundingBox()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(await page.evaluate(() => innerWidth))
    await button.press('Escape')
  }
})

test('keeps every editable numeric control and saved model in sync', async ({ page }) => {
  test.slow() // This sweep exercises every advanced control, including on shared CI runners.
  await open(page)
  await expand(page)
  await page.getByRole('checkbox', { name: 'Use current-law SALT caps' }).uncheck()
  const controls = page.locator('input[type=number]:enabled')
  for (let i = 0; i < await controls.count(); i++) {
    const control = controls.nth(i)
    const current = Number(await control.inputValue())
    const step = Number(await control.getAttribute('step')) || 1
    const max = await control.getAttribute('max')
    const next = max && current + step > Number(max) ? current - step : current + step
    await control.fill(String(next))
    await control.blur()
    await expect(control).toHaveValue(String(next))
  }
  const expected = await saved(page)
  await page.reload()
  await expect(page.locator('main')).toHaveAttribute('data-ready', 'true')
  await expect.poll(async () => saved(page)).toEqual(expected)
  await expect(page.locator('.results-panel')).not.toContainText(/NaN|Infinity/)
})
