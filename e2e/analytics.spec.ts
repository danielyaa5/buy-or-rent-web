import { test, expect } from '@playwright/test'

// Production is simulated by answering its requests from the local test server, and PostHog's
// script is replaced by a stub that records how it was started, so nothing leaves the machine.
const production = 'https://buy-or-rent-web.vercel.app'
const assets = 'https://us-assets.i.posthog.com'
type Init = { token: string; config: Record<string, unknown> & { before_send: (event: object) => { properties: Record<string, unknown> } } }

test('starts cookieless page views on the production host without sending scenario inputs', async ({ page, baseURL }) => {
  const outside: string[] = []
  page.on('request', (r) => { if (![production, assets].includes(new URL(r.url()).origin)) outside.push(r.url()) })
  await page.route(`${production}/**`, async (route) => {
    const url = new URL(route.request().url())
    await route.fulfill({ response: await page.request.fetch(`${baseURL}${url.pathname}${url.search}`) })
  })
  await page.route(`${assets}/static/array.js`, (route) => route.fulfill({
    headers: { 'access-control-allow-origin': '*', 'content-type': 'application/javascript' },
    body: 'window.posthog = { init(token, config) { window.__posthogInit = { token, config } } }',
  }))

  await page.goto(`${production}/#scenario=version=2&homePrice=912345`)
  await expect(page.locator('main')).toHaveAttribute('data-ready', 'true')
  await expect(page.getByLabel('Home price', { exact: true })).toHaveValue('912345')
  await page.waitForFunction(() => '__posthogInit' in window)

  const started = await page.evaluate((origin) => {
    const { token, config } = (window as unknown as { __posthogInit: Init }).__posthogInit
    const event = config.before_send({
      event: '$pageview',
      properties: { $current_url: `${origin}/#scenario=version=2&homePrice=912345`, $referrer: `${origin}/?homePrice=912345&income=150000` },
    })
    return { token, cookieless: config.cookieless_mode, profiles: config.person_profiles, autocapture: config.autocapture, recording: config.disable_session_recording, properties: event.properties }
  }, production)
  expect(started.token).toMatch(/^phc_\w+$/)
  expect(started).toMatchObject({ cookieless: 'always', profiles: 'never', autocapture: false, recording: true })
  expect(started.properties).toEqual({ $current_url: `${production}/`, $referrer: `${production}/` })
  expect(outside).toEqual([])
})
