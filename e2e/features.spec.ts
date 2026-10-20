import { test, expect, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFile } from 'node:fs/promises'

async function open(page: Page, url = '/') {
  await page.goto(url)
  await expect(page.locator('main')).toHaveAttribute('data-ready', 'true')
}

test('pins, compares, restores, and removes independent scenarios', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Pin this as scenario A' }).click()
  await page.getByLabel('Home price', { exact: true }).fill('500000')
  const comparison = page.getByRole('region', { name: 'Scenario comparison', exact: true })
  await expect(comparison.getByRole('row', { name: /Home price/ })).toContainText('$750,000$500,000')
  await page.reload()
  await expect(comparison).toBeVisible()
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('500000')
  await page.getByRole('button', { name: 'Restore scenario A' }).click()
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('750000')
  await page.getByRole('button', { name: 'Remove pinned scenario' }).click()
  await expect(comparison).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Pin this as scenario A' })).toBeVisible()
  await page.getByRole('button', { name: 'Pin this as scenario A' }).click()
  await page.getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(comparison).toHaveCount(0)
})

test('supports a temporary pin when storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError') } }))
  await open(page)
  await page.getByRole('button', { name: 'Pin this as scenario A' }).click()
  await expect(page.locator('.pin-notice')).toContainText('for this visit')
  await page.getByLabel('Home price', { exact: true }).fill('500000')
  await page.getByRole('button', { name: 'Restore scenario A' }).click()
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('750000')
})

test('applies disclosed property presets and expands groups independently', async ({ page }) => {
  await open(page)
  await page.getByText('Try a property preset', { exact: true }).click()
  await expect(page.locator('.property-presets')).toContainText('400')
  await page.getByRole('button', { name: 'Apply condo preset' }).click()
  await page.getByRole('button', { name: 'Fine-tune assumptions' }).click()
  const groups = page.locator('.advanced-content > details')
  expect(await groups.count()).toBe(7)
  expect(await page.locator('.advanced-content > details[open]').count()).toBe(0)
  for (const group of await groups.all()) await group.locator('summary').click()
  await expect(page.getByLabel('Monthly HOA', { exact: true })).toHaveValue('400')
  await page.getByRole('button', { name: 'Apply house preset' }).click()
  await expect(page.getByLabel('Monthly HOA', { exact: true })).toHaveValue('0')
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('750000')
})

test('shows accelerated payoff and its cash-flow breakdown', async ({ page }) => {
  await open(page, '/?homePrice=120000&downPaymentPercent=0&mortgageRate=0&loanTermYears=10&monthlyExtraPrincipal=7000&stayYears=2')
  await expect(page.locator('.payoff-note')).toContainText('paid off')
  await page.getByText('See the month-one cost breakdown', { exact: true }).click()
  await expect(page.locator('.cost-breakdown')).toContainText('$8,000')
  await expect(page.locator('.cost-breakdown')).toContainText('Principal')
})

test('downloads annual CSV including the final partial year', async ({ page }) => {
  await open(page, '/?stayYears=1.5')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download annual CSV' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('buy-or-rent-annual-comparison.csv')
  const csv = await readFile((await download.path())!, 'utf8')
  expect(csv).toContain('Month,Years,Buy wealth,Rent wealth')
  expect(csv.trim().split('\n').at(-1)).toMatch(/^18,1.50,/)
  expect(csv).not.toMatch(/NaN|Infinity/)
})

test('prints complete results and assumptions and restores disclosure state', async ({ page }, testInfo) => {
  await open(page)
  await page.evaluate(() => { window.print = () => { window.dispatchEvent(new Event('beforeprint')) } })
  await page.getByRole('button', { name: 'Print / save PDF' }).click()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.print-assumptions')).toBeVisible()
  await expect(page.locator('.inputs-panel')).not.toBeVisible()
  await expect(page.locator('.cost-breakdown .cost-total').first()).toBeVisible()
  await expect(page.locator('.timeline-details tbody tr')).toHaveCount(10)
  await expect(page.locator('.timeline-details .table-wrap')).toHaveCSS('max-height', 'none')
  const lastRow = await page.locator('.timeline-details tbody tr').last().boundingBox()
  const assumptions = await page.locator('.print-assumptions').boundingBox()
  expect(lastRow!.y + lastRow!.height).toBeLessThanOrEqual(assumptions!.y)
  await page.screenshot({ scale: 'css', path: testInfo.outputPath('print-layout.png'), fullPage: true })
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')))
  await page.emulateMedia({ media: 'screen' })
  await expect(page.locator('.cost-breakdown')).not.toHaveAttribute('open')
  if (testInfo.project.name === 'chromium') {
    await page.emulateMedia({ media: null })
    await page.pdf({ path: testInfo.outputPath('scenario.pdf'), format: 'A4', printBackground: true })
  }
})

test('comparison and cost breakdown are accessible and fit the viewport', async ({ page }, testInfo) => {
  await open(page)
  await page.getByRole('button', { name: 'Pin this as scenario A' }).click()
  await page.getByText('See the month-one cost breakdown', { exact: true }).click()
  await page.getByLabel('Home price', { exact: true }).fill('550000')
  const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations
  expect(violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.failureSummary) }))).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false)
  if (testInfo.project.name === 'mobile') {
    await page.locator('.mobile-results-shortcut').click()
    await expect(page).toHaveURL(/#results$/)
    await expect(page.locator('.verdict')).toBeInViewport()
  }
  await page.screenshot({ scale: 'css', path: testInfo.outputPath('new-features.png'), fullPage: true })
})

test('warns about different horizons and can replace the pinned scenario', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: 'Pin this as scenario A' }).click()
  await page.locator('#stay-years').focus()
  await page.locator('#stay-years').press('ArrowLeft')
  await expect(page.locator('.comparison-warning')).toContainText('different time horizons')
  await page.getByRole('button', { name: 'Replace pinned scenario A' }).click()
  await expect(page.locator('.comparison-warning')).toHaveCount(0)
  await expect(page.getByText('0 changed assumptions', { exact: true })).toBeVisible()
})

test('ignores a corrupt saved pin and preserves the current scenario', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('buy-or-rent-pinned-v1', '{broken'))
  await open(page)
  await expect(page.getByRole('button', { name: 'Pin this as scenario A' })).toBeVisible()
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('750000')
})
